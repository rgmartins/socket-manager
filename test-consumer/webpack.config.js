const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const path = require('path'); // <-- ADICIONADO
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin'); // <-- ADICIONADO

module.exports = {
  output: {
    path: path.join(__dirname, 'dist'),
  },
  // ADICIONADO a seção inteira abaixo
  resolve: {
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, '..', 'tsconfig.base.json'),
      }),
    ],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
};