const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const path = require('path'); // <-- Usaremos o módulo 'path'
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  output: {
    path: path.join(__dirname, 'dist'),
  },
  resolve: {
    plugins: [
      new TsconfigPathsPlugin({
        // MUDANÇA PRINCIPAL AQUI: Criando um caminho absoluto e sem erros
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