import { useState, useEffect, useCallback } from 'react';
import { GovernmentalDocument } from '../types';

const STORAGE_KEY = 'hr_dashboard_gov_docs';

export const usePersistentGovDocs = (): {
  govDocs: GovernmentalDocument[];
  addGovDoc: (doc: Omit<GovernmentalDocument, 'id'>) => void;
  updateGovDoc: (doc: GovernmentalDocument) => void;
  deleteGovDoc: (docId: string) => void;
  loading: boolean;
} => {
  const [govDocs, setGovDocs] = useState<GovernmentalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedDocs = localStorage.getItem(STORAGE_KEY);
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs).map((d: any) => ({
            ...d,
            issueDate: d.issueDate ? new Date(d.issueDate) : null,
            expiryDate: d.expiryDate ? new Date(d.expiryDate) : null,
        }));
        setGovDocs(parsed);
      }
    } catch (error) {
      console.error('Failed to load governmental documents from localStorage', error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(govDocs));
    } catch (error) {
      console.error('Failed to save governmental documents to localStorage', error);
    }
  }, [govDocs]);

  const addGovDoc = useCallback((newDocData: Omit<GovernmentalDocument, 'id'>) => {
    const newDoc: GovernmentalDocument = {
      ...newDocData,
      id: `${newDocData.documentType}-${Date.now()}`,
    };
    setGovDocs(prev => {
        if (prev.some(d => d.documentNumber === newDoc.documentNumber && d.documentType === newDoc.documentType)) {
            alert(`Error: A document with number "${newDoc.documentNumber}" of type "${newDoc.documentType}" already exists.`);
            return prev;
        }
        return [...prev, newDoc];
    });
  }, []);

  const updateGovDoc = useCallback((updatedDoc: GovernmentalDocument) => {
    setGovDocs(prev =>
      prev.map(d =>
        d.id === updatedDoc.id ? updatedDoc : d
      )
    );
  }, []);

  const deleteGovDoc = useCallback((docId: string) => {
    setGovDocs(prev => prev.filter(d => d.id !== docId));
  }, []);


  return { govDocs, addGovDoc, updateGovDoc, deleteGovDoc, loading };
};