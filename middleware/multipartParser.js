var formidable = require('formidable');

function multipartMiddleware(req, res, next) {
  new formidable.IncomingForm().parse(req, (err, fields, files) => {
    if (err) {
      console.error(new Date() + 'Error', err)
      return next(err);
    }
    req.body = fields;

    console.log('fields', fields)
    // console.log('Files', files)
    req.files = files;
    for (const file of Object.entries(files)) {
      // console.log(file)
    }

    next();
  });
}

module.exports = multipartMiddleware;
