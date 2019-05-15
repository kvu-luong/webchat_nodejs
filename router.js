const express = require('express');
const fs = require('fs');

var formidable = require('formidable');
var session = require("express-session");
const router = express.Router();




router.post('/', function (req, res){

  session.file_type = "vukhanh";
  console.log("inside router post");
  var form = new formidable.IncomingForm();

  fileTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mp3', 'text/plain'];

form.onPart = part => {
  console.log(part.mime);
    if (fileTypes.indexOf(part.mime) === -1) {
        // Here is the invalid file types will be handled. 
        // You can listen on 'error' event
        form._error(new Error('File type is not supported'));
    }
    if (!part.filename || fileTypes.indexOf(part.mime) !== -1) {
        // Let formidable handle the non file-pars and valid file types
        form.handlePart(part);
    }
};

form.parse(req).on('error', _err => {
    // You also pass it through next() to errorHandle function
    console.log(_err.message); // output: File type is not supported
})
  // form.parse(req);

  form.on('fileBegin', function (name, file){
      file.path = __dirname + '/helper/upload_file/' + file.name;
  });

  form.on('file', function (name, file){
      console.log('Uploaded ' + file.name);
      
  });
  console.log(session.file_type);
  
  fs.readdir('helper/upload_file', (err, data) => {
    if (err) throw err;
    data.forEach((el) => {
     fs.readFile('helper/upload_file/' + el, (err, data) => {
      if (err) throw err;
     });
    });
   });
  return res.redirect("/");
});
module.exports = router;