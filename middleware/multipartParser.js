var formidable = require('formidable');
var uploadDir = process.env.NODE_DEPLOY_TARGET === "production" ? '/data/tmp' : '/tmp';

console.log('Using upload dir of ' + uploadDir);
function multipartMiddleware(req, res, next) {
  new formidable.IncomingForm({
    multiples: true,
    maxFileSize: 1610612736,
    uploadDir: uploadDir,
  }).parse(req, (err, fields, files) => {
    if (err) {
      console.error(new Date() + 'Error', err)
      return next(err);
    }

    req.body = fields;
    req.files = files;

    next();
  });
}

module.exports = multipartMiddleware;
