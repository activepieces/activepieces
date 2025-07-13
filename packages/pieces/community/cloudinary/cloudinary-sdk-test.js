const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: 'de7qxfvjd',
  api_key: '***REMOVED***', // or your other key
  api_secret: '***REMOVED***', // or your other secret
});

const filePath = path.join(__dirname, 'sample.jpg');

cloudinary.uploader.upload(filePath, { resource_type: 'auto' }, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK error:', error);
  } else {
    console.log('Cloudinary SDK upload result:', result);
  }
}); 