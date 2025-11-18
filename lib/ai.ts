import { GoogleGenAI, Type } from "@google/genai";
import { Employee } from '../types';

export type RawRow = Record<string, any>;
export type CorrectedRow = Record<string, any>;

const DEFAULT_TIMEOUT_MS = 30_000; // 30s
const DEFAULT_RETRIES = 2;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function promiseWithTimeout<T>(p: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS, onTimeoutError?: string) {
  let timer: any;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new Error(onTimeoutError || `Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([p.finally(() => clearTimeout(timer)), timeout]);
}

/**
 * Simple, fast local normalizer - trims strings, normalizes keys (common bilingual headers),
 * tries basic date recognition and returns same shape of corrected rows.
 * Good fallback when AI is unavailable or too slow.
 */
export function localStandardizeData(rawRows: RawRow[]): CorrectedRow[] {
  const bilingualMap: Record<string, string> = {
    'Employee ID': 'Employee ID',
    'رقم الموظف': 'Employee ID',
    'Employee Name (Arabic)': 'Employee Name (Arabic)',
    'اسم الموظف (عربي)': 'Employee Name (Arabic)',
    'Employee Name (English)': 'Employee Name (English)',
    'اسم الموظف (انجليزي)': 'Employee Name (English)',
    'Nationality': 'Nationality',
    'الجنسية': 'Nationality',
    'Department': 'Department',
    'القسم': 'Department',
    'Position/Job Title': 'Position/Job Title',
    'المسمى الوظيفي': 'Position/Job Title',
    'Date of Joining': 'Date of Joining',
    'تاريخ الالتحاق': 'Date of Joining',
    'Sponsor Name': 'Sponsor Name',
    'اسم الكفيل': 'Sponsor Name',
    'Contract Type': 'Contract Type',
    'نوع العقد': 'Contract Type',
    'Contract Start Date': 'Contract Start Date',
    'Contract End Date': 'Contract End Date',
    'Iqama Number': 'Iqama Number',
    'Iqama Issue Date': 'Iqama Issue Date',
    'Iqama Expiry Date': 'Iqama Expiry Date',
    'Basic Salary': 'Basic Salary',
  };

  const normalizeKey = (k: string) => {
    if (!k) return k;
    k = String(k).trim();
    if (bilingualMap[k]) return bilingualMap[k];
    const match = Object.keys(bilingualMap).find(key => key.toLowerCase() === k.toLowerCase());
    if (match) return bilingualMap[match];
    return k;
  };

  const parseDate = (val: any): string | null => {
    if (!val && val !== 0) return null;
    try {
      if (typeof val === 'number') { // Handle Excel numeric dates
          const excelEpoch = new Date(1899, 11, 30);
          const date = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
          if (!isNaN(date.getTime())) {
               return date.toISOString().split('T')[0];
          }
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch { /* ignore */ }
    return String(val).trim() || null;
  };

  return rawRows.map((r) => {
    const out: CorrectedRow = {};
    Object.entries(r).forEach(([k, v]) => {
      const nk = normalizeKey(k);
      const lowerNk = nk.toLowerCase();
      if (lowerNk.includes('date') || lowerNk.includes('dob')) {
        out[nk] = parseDate(v);
      } else if (typeof v === 'string') {
        out[nk] = v.trim();
      } else if (v === undefined || v === null) {
        out[nk] = '';
      } else {
        out[nk] = v;
      }
    });
    return out;
  });
}

/**
 * Main public function the app imports.
 */
export async function correctDataWithAI(
  rawRows: RawRow[],
  options?: { useAI?: boolean; timeoutMs?: number; retries?: number; sampleLimit?: number; serverEndpoint?: string, disableAIOverride?: boolean }
): Promise<CorrectedRow[]> {
  const { useAI = true, timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES, sampleLimit = 300, serverEndpoint, disableAIOverride = false } = options || {};

  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  const shouldSample = rawRows.length > sampleLimit;
  const sample = shouldSample ? rawRows.slice(0, sampleLimit) : rawRows;

  if (!useAI || disableAIOverride || !serverEndpoint) {
    return localStandardizeData(rawRows);
  }

  let attempt = 0;
  let lastErr: any = null;

  while (attempt <= retries) {
    attempt++;
    try {
      const payload = { rows: sample, sampleOnly: shouldSample };

      const aiCall = fetch(serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`AI proxy responded ${res.status}: ${txt}`);
        }
        const json = await res.json();
        if (!json || !Array.isArray(json.correctedRows)) {
          throw new Error('AI proxy returned unexpected payload.');
        }
        if (!shouldSample || json.correctedRows.length === rawRows.length) {
          return json.correctedRows;
        } else {
          const remainder = rawRows.slice(sampleLimit);
          const remainderNorm = localStandardizeData(remainder);
          return [...json.correctedRows, ...remainderNorm];
        }
      });

      const result = await promiseWithTimeout(aiCall, timeoutMs, 'AI proxy timed out');
      return result as CorrectedRow[];
    } catch (err) {
      lastErr = err;
      await sleep(1000 * attempt);
      if (attempt > retries) break;
    }
  }

  console.error('AI correction failed after retries:', lastErr);
  throw new Error(`AI correction failed: ${lastErr?.message || lastErr}.`);
}


export async function queryDataWithAI(question: string, data: Employee[]): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Sanitize data for the prompt to reduce token count and focus the model
    const minimalData = data.map(emp => ({
        ID: emp.employeeId,
        Name: emp.employeeNameEnglish,
        Nationality: emp.nationality,
        Department: emp.department,
        JobTitle: emp.jobTitle,
        Status: emp.status,
        JoiningDate: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split('T')[0] : null,
        TenureYears: emp.tenure?.toFixed(1),
        ContractType: emp.contract.contractType,
        ContractEndDate: emp.contract.endDate ? new Date(emp.contract.endDate).toISOString().split('T')[0] : null,
        IqamaExpiryDate: emp.visa.iqamaExpiryDate ? new Date(emp.visa.iqamaExpiryDate).toISOString().split('T')[0] : null,
        Sponsor: emp.sponsorName,
        Salary: emp.payroll.basicSalary,
    }));

    const prompt = `
        You are an expert HR data analyst AI assistant for a company in Saudi Arabia.
        Your task is to answer questions based *ONLY* on the provided employee data JSON.
        Do not use any external knowledge or make assumptions.
        If the data does not contain the answer, state that clearly.
        Keep your answers concise and to the point.
        When listing multiple employees, format the response as a simple, easy-to-read markdown table.

        Here is the user's question:
        "${question}"

        Here is the employee data you must use to answer the question:
        ${JSON.stringify(minimalData.slice(0, 500))}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
            },
        });

        return response.text;
    } catch (error: any) {
        console.error("Error during AI data query:", error);
        const errorMessage = (error.message || '').toLowerCase();
        if (errorMessage.includes('api key')) {
             throw new Error("AI Service Error: Invalid API Key.");
        }
        if (errorMessage.includes('quota')) {
             throw new Error("AI Service Error: API Quota Exceeded.");
        }
        throw new Error(`AI query failed. Please try again.`);
    }
}
