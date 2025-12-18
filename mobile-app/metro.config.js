const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude expo-in-app-purchases from Android bundle
config.resolver.blacklistRE = config.resolver.blacklistRE || [];
if (process.env.PLATFORM === 'android') {
  config.resolver.blacklistRE.push(/node_modules\/expo-in-app-purchases\/.*/);
}

module.exports = config;
