module.exports = function (api) {
  api.cache(false);
  return {
    presets: ['module:@react-native/babel-preset'],
    env: {
      production: {
        plugins: [
          'react-native-paper/babel',
          [
            'module:react-native-dotenv',
            {
              envName: 'APP_ENV',
              moduleName: '@env',
              path: '.env',
              blocklist: null,
              allowlist: null,
              safe: false,
              allowUndefined: true,
              verbose: false,
            },
          ],
        ],
      },
    },
  };
};
