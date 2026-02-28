/**
 * Expo app config. Loads base config from app.json and injects
 * sensitive values from environment variables.
 *
 * Set EAS_PROJECT_ID in .env (copy from .env.example)
 * For EAS Build cloud: add EAS_PROJECT_ID in EAS project secrets.
 */

require('dotenv').config();

const baseConfig = require('./app.json');

const projectId = process.env.EAS_PROJECT_ID;

module.exports = {
  ...baseConfig,
  expo: {
    ...baseConfig.expo,
    extra: {
      ...baseConfig.expo.extra,
      eas: {
        ...baseConfig.expo.extra?.eas,
        ...(projectId && { projectId }),
      },
    },
  },
};
