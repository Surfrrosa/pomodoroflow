/**
 * TipJarModal - Empathetic donation prompt
 *
 * Cross-platform (iOS + Android) via expo-iap.
 */

import React, { useEffect, useState } from 'react';
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
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Purchase,
} from 'expo-iap';
import TipJarService from '../services/TipJarService';
import * as ErrorReporter from '../services/ErrorReporter';
import { MONETIZATION_CONFIG } from '../config/monetization';

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

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        await initConnection();
      } catch (e) {
        if (!cancelled) {
          ErrorReporter.captureException(e as Error, {
            where: 'iap.initConnection',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
      endConnection().catch((e) =>
        ErrorReporter.captureException(e as Error, {
          where: 'iap.endConnection',
        })
      );
    };
  }, [visible]);

  const getTipOptions = () => [
    {
      id:
        Platform.OS === 'ios'
          ? MONETIZATION_CONFIG.TIP_JAR_COFFEE_IOS
          : MONETIZATION_CONFIG.TIP_JAR_COFFEE_ANDROID,
      amount: MONETIZATION_CONFIG.TIP_COFFEE_AMOUNT,
      label: 'Coffee',
      description: 'Small thanks',
    },
    {
      id:
        Platform.OS === 'ios'
          ? MONETIZATION_CONFIG.TIP_JAR_LUNCH_IOS
          : MONETIZATION_CONFIG.TIP_JAR_LUNCH_ANDROID,
      amount: MONETIZATION_CONFIG.TIP_LUNCH_AMOUNT,
      label: 'Lunch',
      description: 'Big thanks',
    },
    {
      id:
        Platform.OS === 'ios'
          ? MONETIZATION_CONFIG.TIP_JAR_SUPPORTER_IOS
          : MONETIZATION_CONFIG.TIP_JAR_SUPPORTER_ANDROID,
      amount: MONETIZATION_CONFIG.TIP_SUPPORTER_AMOUNT,
      label: 'Supporter',
      description: 'Huge thanks',
    },
  ];

  const handleTip = async (productId: string, amount: number) => {
    setPurchasing(true);
    const iapContext = { productId, amount, trigger, platform: Platform.OS };
    ErrorReporter.addBreadcrumb('Tip jar purchase started', 'iap', iapContext);

    let purchase: Purchase | null = null;
    try {
      purchase = await new Promise<Purchase>((resolve, reject) => {
        const successSub = purchaseUpdatedListener((p) => {
          cleanup();
          resolve(p);
        });
        const errorSub = purchaseErrorListener((err) => {
          cleanup();
          reject(err);
        });
        const cleanup = () => {
          successSub.remove();
          errorSub.remove();
        };

        ErrorReporter.addBreadcrumb('IAP fetchProducts', 'iap', { productId });
        fetchProducts({ skus: [productId], type: 'in-app' })
          .then((products) => {
            if (!products || products.length === 0) {
              throw new Error('Product not found');
            }
            ErrorReporter.addBreadcrumb('IAP requestPurchase', 'iap', {
              productId,
            });
            return requestPurchase({
              request: {
                apple: { sku: productId },
                google: { skus: [productId] },
              },
              type: 'in-app',
            });
          })
          .catch((err) => {
            cleanup();
            reject(err);
          });
      });
    } catch (error: any) {
      const code = error?.code;
      const isCancel =
        code === 'E_USER_CANCELLED' ||
        code === 'user-cancelled' ||
        code === 'USER_CANCELLED';
      if (isCancel) {
        if (__DEV__) console.log('[TipJar] User cancelled purchase');
      } else {
        console.error('[TipJar] Purchase error:', error);
        ErrorReporter.captureException(
          error instanceof Error ? error : new Error(String(error)),
          { ...iapContext, errorCode: code, errorMessage: error?.message }
        );
        Alert.alert(
          'Oops!',
          "Something went wrong. No worries, you weren't charged.",
          [{ text: 'OK' }]
        );
      }
      setPurchasing(false);
      return;
    }

    try {
      ErrorReporter.addBreadcrumb('IAP finishTransaction', 'iap', { productId });
      await finishTransaction({ purchase, isConsumable: true });
      await TipJarService.recordDonation(amount, trigger);
      Alert.alert(
        'Thank you',
        'Your support means the world. It helps keep this app ad-free and independent.',
        [{ text: "You're welcome!", onPress: onClose }]
      );
    } catch (error: any) {
      ErrorReporter.captureException(
        error instanceof Error ? error : new Error(String(error)),
        { ...iapContext, phase: 'finishTransaction' }
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleDismiss = async () => {
    await TipJarService.recordDismissed(trigger);
    onClose();
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
          <Text style={styles.title}>Thank you for using PomodoroFlow</Text>
          <Text style={styles.message}>
            This app is completely free and always will be. If PomodoroFlow has
            helped you stay focused, consider supporting our work. Every bit
            helps us keep building tools you love. No pressure. We&apos;re happy
            you&apos;re here :-)
          </Text>

          <View style={styles.tipOptions}>
            {getTipOptions().map((option) => (
              <Pressable
                key={option.id}
                style={[styles.tipButton, purchasing && styles.buttonDisabled]}
                onPress={() => handleTip(option.id, option.amount)}
                disabled={purchasing}
                accessibilityRole="button"
                accessibilityLabel={`${option.label} tip — $${option.amount.toFixed(2)}`}
                accessibilityState={{ disabled: purchasing }}
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

          <Pressable
            style={styles.closeButton}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Close tip jar"
          >
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
