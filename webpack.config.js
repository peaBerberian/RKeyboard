const webpack = require("webpack");
const path = require("path");

const RKB_ENV = process.env.RKB_ENV || "production";

if (["development", "production"].indexOf(RKB_ENV) < 0) {
  throw new Error("unknown RKB_ENV " + RKB_ENV);
}

const isDevMode = RKB_ENV === "development";

module.exports = {
  mode: isDevMode ? "development" : "production",
  entry: './src/index.js',
  output: {
    library: "RKeyboard",
    libraryTarget: "umd",
    path: path.join(__dirname, "./dist"),
    filename: isDevMode ? "r-keyboard.js" : "r-keyboard.min.js",
  },
  module: {
    rules: [
      {
        test: /src\/.*\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
              presets: [
                [ "@babel/env", { loose: true, modules: false } ],
              ],
            },
          }
        ]
      }
    ],
  }
};
