let fs = require("fs")
let Path = require("path")
let R = require("ramda")
let Webpack = require("webpack")


let commonConfigs = {
  module: {
    rules: [
      {test: /\.js$/, use: "babel-loader", exclude: /node_modules/},
    ]
  },
  resolve: {
    modules: [
      Path.resolve(__dirname, "node_modules"),
      Path.resolve(Path.resolve(__dirname, "../../vendors")),
      Path.resolve(Path.resolve(__dirname, "../../node_modules")),
    ],
  },
}

let frontendConfigs = {
  devtool: "eval",
  entry: {
    app: "./client/index.js",
  },
  output: {
    pathinfo: true,
    filename: "js/[name].js",
    path: Path.resolve("public"),
    publicPath: "/",
  },
  node: {
    fs: "empty" // TODO: think if I can/should avoid it
  },
}

// Article about configuring Webpack for backend:
// http://jlongster.com/Backend-Apps-with-Webpack--Part-I
let backendConfigs = {
  entry: {
    server: "./server/index.js",
  },
  output: {
    filename: "[name].js",
    path: Path.resolve("build"),
  },
  target: "node",
  externals: R.reduce((memo, module) => {
    return R.indexOf(".bin", module) === -1
      ? R.assoc(module,  "commonjs " + module, memo)
      : memo
  }, {}, fs.readdirSync("node_modules")),
  devtool: "sourcemap",
  plugins: [
    new Webpack.IgnorePlugin(/\.(css|less)$/),
    new Webpack.BannerPlugin({
      banner: "require(\"source-map-support\").install();",
      raw: true,
      entryOnly: false
    }),
  ],
}

module.exports = [
  R.merge(frontendConfigs, commonConfigs),
  R.merge(backendConfigs, commonConfigs),
]



