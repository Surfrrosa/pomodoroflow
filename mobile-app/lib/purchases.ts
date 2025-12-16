/**
 * In-App Purchase Management with Revenue Cat
 * Handles premium upgrade and subscription logic
 */

import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, MONETIZATION_CONFIG } from '../config/monetization';

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
      // Get API key from environment or config
      const apiKey = this.getApiKey();

      if (!apiKey || apiKey === 'YOUR_REVENUE_CAT_API_KEY') {
        console.warn('[PURCHASES] RevenueCat API key not configured - purchases disabled');
        return;
      }

      // Initialize Revenue Cat
      await Purchases.configure({
        apiKey,
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

  private getApiKey(): string {
    const Platform = require('react-native').Platform;

    if (Platform.OS === 'ios') {
      return MONETIZATION_CONFIG.REVENUECAT_IOS_KEY;
    } else {
      return MONETIZATION_CONFIG.REVENUECAT_ANDROID_KEY;
    }
  }

  async getPremiumStatus(): Promise<PremiumStatus> {
    try {
      // Use FreemiumService for comprehensive status check
      const FreemiumService = require('../services/FreemiumService').default;
      const status = await FreemiumService.canStartSession();

      return {
        isPremium: status.isPremium,
        dailySessionsUsed: status.dailySessions,
        dailySessionsLimit: status.sessionsRemaining === Infinity ? Infinity : 8,
        canStartNewSession: status.canStart,
      };
    } catch (error) {
      console.error('[PURCHASES] Error getting premium status:', error);
      // Return safe defaults
      return {
        isPremium: false,
        dailySessionsUsed: 0,
        dailySessionsLimit: 8,
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
      // Check for configured entitlement ID
      const isPremium = customerInfo.entitlements.active[MONETIZATION_CONFIG.REVENUECAT_ENTITLEMENT_ID] !== undefined;

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
      if (!this.isInitialized) {
        return { success: false, error: 'Purchases not initialized' };
      }
    }

    try {
      // Get available offerings
      const offerings = await Purchases.getOfferings();

      if (!offerings.current || !offerings.current.availablePackages || offerings.current.availablePackages.length === 0) {
        return { success: false, error: 'No products available. Please try again later.' };
      }

      // Get the lifetime/premium package (should be the only one)
      const premiumPackage = offerings.current.availablePackages[0];

      if (!premiumPackage) {
        return { success: false, error: 'No premium package found. Please try again later.' };
      }

      if (__DEV__) {
        console.log('[PURCHASES] Purchasing package:', premiumPackage.identifier);
      }

      // Purchase the package
      const purchaseResult = await Purchases.purchasePackage(premiumPackage);

      // Check if premium is now active
      const isPremium = purchaseResult.customerInfo.entitlements.active[MONETIZATION_CONFIG.REVENUECAT_ENTITLEMENT_ID] !== undefined;

      if (isPremium) {
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
        return { success: false, error: 'cancelled' }; // Special case - user cancelled
      }

      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        return { success: false, error: 'Purchases not initialized' };
      }
    }

    try {
      const customerInfo = await Purchases.restorePurchases();

      // Check for configured entitlement
      const isPremium = customerInfo.entitlements.active[MONETIZATION_CONFIG.REVENUECAT_ENTITLEMENT_ID] !== undefined;

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
      // Use SessionTrackingService for session counting
      const SessionTrackingService = require('../services/SessionTrackingService').default;
      await SessionTrackingService.incrementDailySession();
    } catch (error) {
      console.error('[PURCHASES] Error incrementing session count:', error);
    }
  }

  private async getUserId(): Promise<string> {
    // Generate a unique user ID for Revenue Cat
    let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
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