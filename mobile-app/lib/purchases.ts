/**
 * In-App Purchase Management with Revenue Cat
 * Handles premium upgrade and subscription logic
 */

import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  IS_PREMIUM: '@pomodoroflow:is_premium',
  DAILY_SESSIONS: '@pomodoroflow:daily_sessions',
  LAST_SESSION_DATE: '@pomodoroflow:last_session_date',
} as const;

export interface PremiumStatus {
  isPremium: boolean;
  dailySessionsUsed: number;
  dailySessionsLimit: number;
  canStartNewSession: boolean;
}

export class PurchaseManager {
  private static instance: PurchaseManager;
  private isInitialized = false;

  static getInstance(): PurchaseManager {
    if (!PurchaseManager.instance) {
      PurchaseManager.instance = new PurchaseManager();
    }
    return PurchaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Revenue Cat
      await Purchases.configure({
        apiKey: 'YOUR_REVENUE_CAT_API_KEY', // You'll replace this with your actual key
      });

      // Set user ID (optional but recommended)
      const userId = await this.getUserId();
      await Purchases.logIn(userId);

      this.isInitialized = true;
      console.log('[PURCHASES] Revenue Cat initialized successfully');
    } catch (error) {
      console.error('[PURCHASES] Failed to initialize:', error);
      // Don't throw - app should work without purchases
    }
  }

  async getPremiumStatus(): Promise<PremiumStatus> {
    try {
      // Check if premium was purchased
      const isPremium = await this.checkPremiumStatus();

      // Get daily session usage
      const { dailySessionsUsed, isNewDay } = await this.getDailySessionUsage();

      // Reset sessions if it's a new day
      if (isNewDay) {
        await this.resetDailySessionCount();
      }

      const dailySessionsLimit = isPremium ? Infinity : 5;
      const canStartNewSession = isPremium || dailySessionsUsed < dailySessionsLimit;

      return {
        isPremium,
        dailySessionsUsed: isNewDay ? 0 : dailySessionsUsed,
        dailySessionsLimit,
        canStartNewSession,
      };
    } catch (error) {
      console.error('[PURCHASES] Error getting premium status:', error);
      // Return safe defaults
      return {
        isPremium: false,
        dailySessionsUsed: 0,
        dailySessionsLimit: 5,
        canStartNewSession: true,
      };
    }
  }

  async checkPremiumStatus(): Promise<boolean> {
    try {
      // First check local storage for offline support
      const localPremium = await AsyncStorage.getItem(STORAGE_KEYS.IS_PREMIUM);

      if (!this.isInitialized) {
        return localPremium === 'true';
      }

      // Check with Revenue Cat for accurate status
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

      // Update local storage
      await AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, isPremium.toString());

      return isPremium;
    } catch (error) {
      console.error('[PURCHASES] Error checking premium status:', error);
      // Fallback to local storage
      const localPremium = await AsyncStorage.getItem(STORAGE_KEYS.IS_PREMIUM);
      return localPremium === 'true';
    }
  }

  async purchasePremium(): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get available offerings
      const offerings = await Purchases.getOfferings();
      const premiumOffering = offerings.current?.availablePackages.find(
        pkg => pkg.identifier === 'premium_unlock'
      );

      if (!premiumOffering) {
        return { success: false, error: 'Premium upgrade not available' };
      }

      // Purchase the offering
      const purchaseResult = await Purchases.purchasePackage(premiumOffering);

      if (purchaseResult.customerInfo.entitlements.active['premium']) {
        // Update local storage
        await AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'true');
        console.log('[PURCHASES] Premium purchased successfully!');
        return { success: true };
      } else {
        return { success: false, error: 'Purchase completed but premium not activated' };
      }
    } catch (error: any) {
      console.error('[PURCHASES] Purchase failed:', error);

      // Handle specific error cases
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled' };
      }

      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

      if (isPremium) {
        await AsyncStorage.setItem(STORAGE_KEYS.IS_PREMIUM, 'true');
        console.log('[PURCHASES] Purchases restored successfully!');
        return { success: true };
      } else {
        return { success: false, error: 'No premium purchases found' };
      }
    } catch (error: any) {
      console.error('[PURCHASES] Restore failed:', error);
      return { success: false, error: error.message || 'Restore failed' };
    }
  }

  async incrementSessionCount(): Promise<void> {
    try {
      const { dailySessionsUsed } = await this.getDailySessionUsage();
      const newCount = dailySessionsUsed + 1;

      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SESSIONS, newCount.toString());
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION_DATE, new Date().toDateString());

      console.log(`[PURCHASES] Session count incremented to ${newCount}`);
    } catch (error) {
      console.error('[PURCHASES] Error incrementing session count:', error);
    }
  }

  private async getDailySessionUsage(): Promise<{ dailySessionsUsed: number; isNewDay: boolean }> {
    try {
      const lastSessionDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION_DATE);
      const dailySessionsStr = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_SESSIONS);

      const today = new Date().toDateString();
      const isNewDay = lastSessionDate !== today;

      const dailySessionsUsed = isNewDay ? 0 : parseInt(dailySessionsStr || '0', 10);

      return { dailySessionsUsed, isNewDay };
    } catch (error) {
      console.error('[PURCHASES] Error getting daily session usage:', error);
      return { dailySessionsUsed: 0, isNewDay: true };
    }
  }

  private async resetDailySessionCount(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SESSIONS, '0');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION_DATE, new Date().toDateString());
    } catch (error) {
      console.error('[PURCHASES] Error resetting daily session count:', error);
    }
  }

  private async getUserId(): Promise<string> {
    // Generate a unique user ID for Revenue Cat
    let userId = await AsyncStorage.getItem('@pomodoroflow:user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await AsyncStorage.setItem('@pomodoroflow:user_id', userId);
    }
    return userId;
  }

  // Development helper - remove in production
  async resetPremiumStatus(): Promise<void> {
    if (__DEV__) {
      await AsyncStorage.removeItem(STORAGE_KEYS.IS_PREMIUM);
      await AsyncStorage.removeItem(STORAGE_KEYS.DAILY_SESSIONS);
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_SESSION_DATE);
      console.log('[PURCHASES] Premium status reset for testing');
    }
  }
}