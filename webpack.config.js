module.exports = {
  entry: './src/index.js',
  output: {
    path: './bin',
    filename: 'remote.js'
  },
  module: {
    loaders: [
      {
      loader: 'babel-loader',
      test: /src\/.*\.js$/
      },
      {
        loader: "eslint-loader",
        test: /src\/.*\.js$/
      }
    ]

  }
};
