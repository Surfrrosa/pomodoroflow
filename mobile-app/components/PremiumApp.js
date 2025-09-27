/**
 * Premium-enabled wrapper for the main app
 * Handles session limiting and upgrade prompts
 */

import React, { useState } from 'react';
import { usePremium } from './PremiumProvider';
import { UpgradePrompt } from './UpgradePrompt';

export const PremiumApp = ({ children, onStartSession }) => {
  const { premiumStatus, canStartSession, incrementSessionCount } = usePremium();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleStartSession = async () => {
    // Check if user can start a session
    if (!canStartSession()) {
      setShowUpgrade(true);
      return false; // Prevent session start
    }

    // Track session for free users
    if (!premiumStatus.isPremium) {
      await incrementSessionCount();
    }

    // Allow session to start
    onStartSession();
    return true;
  };

  const handleCloseUpgrade = () => {
    setShowUpgrade(false);
  };

  // Clone children and pass the enhanced start handler
  const enhancedChildren = React.cloneElement(children, {
    onStartSession: handleStartSession,
    premiumStatus,
  });

  return (
    <>
      {enhancedChildren}
      <UpgradePrompt
        visible={showUpgrade}
        onClose={handleCloseUpgrade}
        trigger="session_limit"
      />
    </>
  );
};