exports.apphttpsdomain = "https://localhost:3184";
exports.port = "3184";
exports.httpsOptions = {
    key: 'fielddb_debug.key',
    cert: 'fielddb_debug.crt'
};
exports.audioVideoRawDir = __dirname.replace(/lib$/g,"") + 'rawdata';
exports.audioVideoByCorpusDir =__dirname.replace(/lib$/g,"") + 'bycorpus';
exports.languagesDir = __dirname.replace(/lib$/g,"") + 'dialectmodels';
exports.praatCommand = " cat lib/praat_segfault_workaround.TextGrid "
