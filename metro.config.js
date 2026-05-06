const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { blockList } = config.resolver;

// Only block specific problematic directories that cause ENOENT
const blockPatterns = [
  /node_modules[\\/]expo-modules-core[\\/]expo-module-gradle-plugin[\\/]bin[\\/].*/,
  /node_modules[\\/]expo-gradle-plugin[\\/]bin[\\/].*/,
  /[\\/]\.gradle[\\/].*/,
  /[\\/]\.cxx[\\/].*/,
];

config.resolver.blockList = [
  ...blockPatterns,
  ...(Array.isArray(blockList) ? blockList : blockList ? [blockList] : []),
];

module.exports = config;
