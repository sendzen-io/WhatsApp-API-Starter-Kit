import React, { createContext, useContext, ReactNode } from 'react';

interface WabaContextType {
  wabaId: string | null;
  phoneId: string | null;
  isOnboarded: boolean;
}

const WabaContext = createContext<WabaContextType | null>(null);

interface WabaProviderProps {
  children: ReactNode;
  wabaId?: string | null;
  phoneId?: string | null;
  isOnboarded?: boolean;
}

export function WabaProvider({ 
  children, 
  wabaId = null, 
  phoneId = null, 
  isOnboarded = false 
}: WabaProviderProps) {
  return (
    <WabaContext.Provider value={{ wabaId, phoneId, isOnboarded }}>
      {children}
    </WabaContext.Provider>
  );
}

export function useWabaContext(): WabaContextType {
  const context = useContext(WabaContext);
  return context || { wabaId: null, phoneId: null, isOnboarded: false };
}


