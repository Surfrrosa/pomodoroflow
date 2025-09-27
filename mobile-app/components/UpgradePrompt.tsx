/**
 * Upgrade Prompt - Beautiful premium upgrade UI
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
} from 'react-native';
import { usePremium } from './PremiumProvider';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  trigger?: 'session_limit' | 'premium_feature';
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  visible,
  onClose,
  trigger = 'session_limit',
}) => {
  const { premiumStatus, purchasePremium, restorePurchases } = usePremium();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const result = await purchasePremium();
      if (result.success) {
        Alert.alert(
          '🎉 Welcome to Premium!',
          'You now have unlimited access to all features!',
          [{ text: 'Awesome!', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Purchase Failed',
          result.error || 'Something went wrong. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Purchase Failed',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert(
          '✅ Purchases Restored!',
          'Your premium features have been restored.',
          [{ text: 'Great!', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRestoring(false);
    }
  };

  const getTitle = () => {
    switch (trigger) {
      case 'session_limit':
        return 'Daily Limit Reached';
      case 'premium_feature':
        return 'Premium Feature';
      default:
        return 'Upgrade to Premium';
    }
  };

  const getMessage = () => {
    switch (trigger) {
      case 'session_limit':
        return `You've used ${premiumStatus.dailySessionsUsed} of ${premiumStatus.dailySessionsLimit} free sessions today.`;
      case 'premium_feature':
        return 'This feature is available in the premium version.';
      default:
        return 'Unlock unlimited access to all features.';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.message}>{getMessage()}</Text>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Premium includes:</Text>
            <Text style={styles.feature}>✓ Unlimited daily sessions</Text>
            <Text style={styles.feature}>✓ Custom timer durations</Text>
            <Text style={styles.feature}>✓ Session history & analytics</Text>
            <Text style={styles.feature}>✓ Premium sounds & themes</Text>
            <Text style={styles.feature}>✓ Apple Watch support</Text>
          </View>

          <View style={styles.pricing}>
            <Text style={styles.price}>$4.99</Text>
            <Text style={styles.priceSubtext}>One-time purchase • No subscriptions</Text>
          </View>

          <Pressable
            style={[styles.purchaseButton, purchasing && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={purchasing || restoring}
          >
            {purchasing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.purchaseButtonText}>Upgrade to Premium</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.restoreButton, restoring && styles.buttonDisabled]}
            onPress={handleRestore}
            disabled={purchasing || restoring}
          >
            {restoring ? (
              <ActivityIndicator color="#666666" />
            ) : (
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            )}
          </Pressable>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Maybe Later</Text>
          </Pressable>
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
  features: {
    width: '100%',
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  feature: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 8,
    paddingLeft: 8,
  },
  pricing: {
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  restoreButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#999999',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});