var formidable = require('formidable');

function multipartMiddleware(req, res, next) {
  new formidable.IncomingForm({
    multiples: true,
    maxFileSize: 1610612736,
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
