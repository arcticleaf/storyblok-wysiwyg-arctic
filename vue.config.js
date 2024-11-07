module.exports = {
  configureWebpack: {
    output: {
      filename: 'index.js'
    },
    optimization: {
      splitChunks: false
    }
  },
  filenameHashing: false,
  runtimeCompiler: true,
  productionSourceMap: false,
  css: {
    extract: false
  }
}