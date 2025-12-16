/**
 * TipJarModal - Empathetic donation prompt
 * Triggered at thoughtful moments when users have gotten value
 *
 * NOTE: iOS only in v1.0.3 due to Android billing library conflicts
 * Android support will be added in v1.0.4
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import TipJarService from '../services/TipJarService';
import { MONETIZATION_CONFIG } from '../config/monetization';

// Conditional import - only load on iOS to avoid Android billing conflicts
let InAppPurchases: any = null;
if (Platform.OS === 'ios') {
  InAppPurchases = require('expo-in-app-purchases');
}

interface TipJarModalProps {
  visible: boolean;
  onClose: () => void;
  trigger: 'power_user' | 'anniversary';
}

export const TipJarModal: React.FC<TipJarModalProps> = ({
  visible,
  onClose,
  trigger,
}) => {
  const [purchasing, setPurchasing] = useState(false);

  // Don't render on Android in v1.0.3 (billing library conflict)
  if (Platform.OS === 'android') {
    return null;
  }

  const getTipOptions = () => [
    {
      id: Platform.OS === 'ios'
        ? MONETIZATION_CONFIG.TIP_JAR_COFFEE_IOS
        : MONETIZATION_CONFIG.TIP_JAR_COFFEE_ANDROID,
      amount: MONETIZATION_CONFIG.TIP_COFFEE_AMOUNT,
      label: 'Coffee',
      description: 'Small thanks',
    },
    {
      id: Platform.OS === 'ios'
        ? MONETIZATION_CONFIG.TIP_JAR_LUNCH_IOS
        : MONETIZATION_CONFIG.TIP_JAR_LUNCH_ANDROID,
      amount: MONETIZATION_CONFIG.TIP_LUNCH_AMOUNT,
      label: 'Lunch',
      description: 'Big thanks',
    },
    {
      id: Platform.OS === 'ios'
        ? MONETIZATION_CONFIG.TIP_JAR_SUPPORTER_IOS
        : MONETIZATION_CONFIG.TIP_JAR_SUPPORTER_ANDROID,
      amount: MONETIZATION_CONFIG.TIP_SUPPORTER_AMOUNT,
      label: 'Supporter',
      description: 'Huge thanks',
    },
  ];

  const handleTip = async (productId: string, amount: number) => {
    setPurchasing(true);
    try {
      // Connect to store
      await InAppPurchases.connectAsync();

      // Get products
      const { results } = await InAppPurchases.getProductsAsync([productId]);

      if (!results || results.length === 0) {
        throw new Error('Product not found');
      }

      // Purchase
      await InAppPurchases.purchaseItemAsync(productId);

      // Record donation
      await TipJarService.recordDonation(amount, trigger);

      // Show thank you
      Alert.alert(
        '💚 Thank You!',
        'Your support means the world. It helps keep this app ad-free and independent.',
        [{ text: 'You\'re welcome!', onPress: onClose }]
      );

      // Disconnect from store
      await InAppPurchases.disconnectAsync();
    } catch (error: any) {
      // User cancelled
      if (error.code === 'E_USER_CANCELLED') {
        if (__DEV__) console.log('[TipJar] User cancelled purchase');
      } else {
        console.error('[TipJar] Purchase error:', error);
        Alert.alert(
          'Oops!',
          'Something went wrong. No worries, you weren\'t charged.',
          [{ text: 'OK' }]
        );
      }

      await InAppPurchases.disconnectAsync();
    } finally {
      setPurchasing(false);
    }
  };

  const handleDismiss = async () => {
    await TipJarService.recordDismissed(trigger);
    onClose();
  };

  const getTitle = () => {
    return 'Thank you for using PomodoroFlow';
  };

  const getMessage = () => {
    return 'This app is completely free and always will be. If PomodoroFlow has helped you stay focused, consider supporting our work. Every bit helps us keep building tools you love. No pressure. We\'re happy you\'re here :-)';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.message}>{getMessage()}</Text>

          <View style={styles.tipOptions}>
            {getTipOptions().map((option) => (
              <Pressable
                key={option.id}
                style={[styles.tipButton, purchasing && styles.buttonDisabled]}
                onPress={() => handleTip(option.id, option.amount)}
                disabled={purchasing}
              >
                <View style={styles.tipButtonContent}>
                  <View style={styles.tipButtonText}>
                    <Text style={styles.tipLabel}>{option.label}</Text>
                    <Text style={styles.tipDescription}>{option.description}</Text>
                  </View>
                  <Text style={styles.tipAmount}>${option.amount.toFixed(2)}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {purchasing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#4CAF50" size="small" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}

          <Pressable style={styles.closeButton} onPress={handleDismiss}>
            <Text style={styles.closeButtonText}>Not right now</Text>
          </Pressable>

          <Text style={styles.disclaimer}>
            One-time payment • No subscriptions • 100% optional
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  tipOptions: {
    width: '100%',
    marginBottom: 16,
  },
  tipButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  tipButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipButtonText: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  tipDescription: {
    fontSize: 14,
    color: '#999999',
  },
  tipAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#999999',
    marginLeft: 8,
    fontSize: 14,
  },
  closeButton: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  closeButtonText: {
    color: '#999999',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
