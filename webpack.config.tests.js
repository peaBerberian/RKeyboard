const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: './bin',
    filename: 'rkeyboard.js'
  },
  module: {
    loaders: [
      {
      loader: 'babel-loader',
      test: /src\/.*\.js$/
      }
    ]
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false
    //   },
    // })
  ]
};
