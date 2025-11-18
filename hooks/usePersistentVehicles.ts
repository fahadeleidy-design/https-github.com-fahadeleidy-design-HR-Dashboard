import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '../types';

const STORAGE_KEY = 'hr_dashboard_vehicles';

export const usePersistentVehicles = (): {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (vehicleId: string) => void;
  loading: boolean;
} => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedVehicles = localStorage.getItem(STORAGE_KEY);
      if (storedVehicles) {
        // Revive dates from strings
        const parsed = JSON.parse(storedVehicles).map((v: any) => ({
            ...v,
            insurance: {
                startDate: v.insurance?.startDate ? new Date(v.insurance.startDate) : null,
                endDate: v.insurance?.endDate ? new Date(v.insurance.endDate) : null,
            },
            inspection: {
                startDate: v.inspection?.startDate ? new Date(v.inspection.startDate) : null,
                endDate: v.inspection?.endDate ? new Date(v.inspection.endDate) : null,
            },
            registration: {
                startDate: v.registration?.startDate ? new Date(v.registration.startDate) : null,
                endDate: v.registration?.endDate ? new Date(v.registration.endDate) : null,
            }
        }));
        setVehicles(parsed);
      }
    } catch (error) {
      console.error('Failed to load vehicles from localStorage', error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    } catch (error) {
      console.error('Failed to save vehicles to localStorage', error);
    }
  }, [vehicles]);

  const addVehicle = useCallback((newVehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...newVehicleData,
      id: newVehicleData.plateNumber, // Use plate number as a unique ID
    };
    setVehicles(prev => {
        if (prev.some(v => v.id === newVehicle.id)) {
            alert(`Error: A vehicle with plate number "${newVehicle.id}" already exists.`);
            return prev;
        }
        return [...prev, newVehicle];
    });
  }, []);

  const updateVehicle = useCallback((updatedVehicle: Vehicle) => {
    setVehicles(prev =>
      prev.map(v =>
        v.id === updatedVehicle.id ? updatedVehicle : v
      )
    );
  }, []);

  const deleteVehicle = useCallback((vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  }, []);


  return { vehicles, addVehicle, updateVehicle, deleteVehicle, loading };
};
