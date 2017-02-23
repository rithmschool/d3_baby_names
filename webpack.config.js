var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

console.log("RESOLVED", path.resolve(__dirname))

module.exports = {
  context: path.resolve(__dirname),
  entry: './assets/js/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  devtool: 'inline-source-map',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: [{
        loader: 'babel-loader',
        options: { presets: ['es2015'] }
      }]
    }, {
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        use: 'css-loader'
      })
    }, {
      test: /\.(jpg|png)$/,
      use: 'file-loader'
    }]
  }, 
  plugins: [
    new ExtractTextPlugin('styles.css')
  ]
};