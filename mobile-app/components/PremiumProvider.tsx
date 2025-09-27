/**
 * Premium Provider - Manages premium status throughout the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PurchaseManager, PremiumStatus } from '../lib/purchases';

interface PremiumContextType {
  premiumStatus: PremiumStatus;
  loading: boolean;
  refreshPremiumStatus: () => Promise<void>;
  purchasePremium: () => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  canStartSession: () => boolean;
  incrementSessionCount: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>({
    isPremium: false,
    dailySessionsUsed: 0,
    dailySessionsLimit: 5,
    canStartNewSession: true,
  });
  const [loading, setLoading] = useState(true);

  const purchaseManager = PurchaseManager.getInstance();

  const refreshPremiumStatus = async () => {
    try {
      setLoading(true);
      const status = await purchaseManager.getPremiumStatus();
      setPremiumStatus(status);
    } catch (error) {
      console.error('[PREMIUM] Error refreshing status:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchasePremium = async () => {
    const result = await purchaseManager.purchasePremium();
    if (result.success) {
      await refreshPremiumStatus();
    }
    return result;
  };

  const restorePurchases = async () => {
    const result = await purchaseManager.restorePurchases();
    if (result.success) {
      await refreshPremiumStatus();
    }
    return result;
  };

  const canStartSession = (): boolean => {
    return premiumStatus.canStartNewSession;
  };

  const incrementSessionCount = async () => {
    if (!premiumStatus.isPremium) {
      await purchaseManager.incrementSessionCount();
      await refreshPremiumStatus();
    }
  };

  useEffect(() => {
    const initializePremium = async () => {
      await purchaseManager.initialize();
      await refreshPremiumStatus();
    };

    initializePremium();
  }, []);

  const contextValue: PremiumContextType = {
    premiumStatus,
    loading,
    refreshPremiumStatus,
    purchasePremium,
    restorePurchases,
    canStartSession,
    incrementSessionCount,
  };

  return (
    <PremiumContext.Provider value={contextValue}>
      {children}
    </PremiumContext.Provider>
  );
};