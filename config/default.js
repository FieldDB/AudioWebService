var fs = require('fs');
var path = require('path');

module.exports = {
  httpsOptions: {
    key: fs.readFileSync(__dirname + '/fielddb_debug.key', 'utf8'),
    cert: fs.readFileSync(__dirname + '/fielddb_debug.crt', 'utf8'),
    port: '3184',
    protocol: 'https://'
  },
  url: 'https://localhost:3184',
  audioVideoRawDir: path.resolve(__dirname, '../rawdata'),
  audioVideoByCorpusDir: path.resolve(__dirname, '../bycorpus'),
  languagesDir: path.resolve(__dirname, '../dialectmodels'),
};
