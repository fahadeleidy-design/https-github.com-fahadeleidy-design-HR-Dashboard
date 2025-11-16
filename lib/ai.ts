
import { GoogleGenAI, Type } from "@google/genai";

const employeeSchema = {
    type: Type.OBJECT,
    properties: {
        'Employee ID': { type: Type.STRING, description: "Unique identifier for the employee." },
        'Employee Name (Arabic)': { type: Type.STRING },
        'Employee Name (English)': { type: Type.STRING },
        'Nationality': { type: Type.STRING },
        'Department': { type: Type.STRING },
        'Position/Job Title': { type: Type.STRING },
        'Status': { type: Type.STRING, description: "Should be standardized to 'Active' or 'Inactive'." },
        'Date of Joining': { type: Type.STRING, description: "Format as YYYY-MM-DD. Use null if invalid or blank." },
        'IQAMA Number': { type: Type.STRING },
        'IQAMA Issue Date': { type: Type.STRING, description: "Format as YYYY-MM-DD. Use null if invalid or blank." },
        'IQAMA Expiry Date': { type: Type.STRING, description: "Format as YYYY-MM-DD. Use null if invalid or blank." },
        'Passport Number': { type: Type.STRING },
        'Passport Issue Date': { type: Type.STRING, description: "Format as YYYY-MM-DD. Use null if invalid or blank." },
        'Passport Expiry Date': { type: Type.STRING, description: "Format as YYYY-MM-DD. Use null if invalid or blank." },
        'Contract Type': { type: Type.STRING, description: "Should be standardized to 'Definite' or 'Indefinite'." },
        'Contract Start Date': { type: Type.STRING, description: "Format as YYYY-MM-DD. Use null if invalid or blank." },
        'Contract End Date': { type: Type.STRING, description: "Format as YYYY-MM-DD. Use null if invalid or blank." },
        'Email Address': { type: Type.STRING },
        'Mobile Number': { type: Type.STRING },
        'Sponsor Name': { type: Type.STRING },
        'Basic Salary': { type: Type.NUMBER, description: "Monthly basic salary as a number. This is an optional field." },
    },
    required: ['Employee ID', 'Employee Name (English)', 'Nationality', 'Department', 'Status']
};

const responseSchema = {
    type: Type.ARRAY,
    items: employeeSchema,
};

export async function correctDataWithAI(rawData: any[]): Promise<any[]> {
    // The GoogleGenAI class is imported directly as an ES module via the importmap.
    // The module loader ensures it's available before this code runs, so a global check is not needed.
    
    // API_KEY is expected to be available in the environment.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an expert HR data analyst for a company in Saudi Arabia. Your task is to correct and standardize the provided JSON data to match a specific schema.

        Instructions:
        1. Analyze the provided raw JSON data which comes from an Excel file.
        2. Map the columns from the raw data to the target schema. Intelligently map headers even if they are slightly different (e.g., map 'Emp ID' to 'Employee ID', 'Full Name' to 'Employee Name (English)', 'Position' to 'Position/Job Title', 'Salary' to 'Basic Salary').
        3. Correct common data entry errors (e.g., typos in department names, inconsistent status values like 'active' vs 'Active'). Standardize 'Status' to 'Active' for any positive status and 'Inactive' otherwise. Standardize 'Contract Type' to 'Definite' or 'Indefinite'.
        4. Standardize ALL dates into 'YYYY-MM-DD' format. If a date is invalid, unparseable, or empty, the value MUST be null.
        5. 'Basic Salary' is an optional field. If present, ensure it is a number, removing any currency symbols or commas. If it's not a valid number or not present, it should be excluded or set to null.
        6. Ensure the output is ONLY a valid JSON array of objects that strictly conforms to the provided schema. Do not add any extra text, explanations, or markdown formatting.

        Raw Data (sample):
        ${JSON.stringify(rawData.slice(0, 20))}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.1 // Use low temperature for deterministic results
            },
        });

        // The response text should be a valid JSON string.
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error: any) {
        console.error("AI Correction API call failed:", error);
        throw new Error(`AI data correction failed. The model returned an error: ${error.message}`);
    }
}