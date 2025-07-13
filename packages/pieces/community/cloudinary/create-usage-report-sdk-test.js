const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'de7qxfvjd',
  api_key: '***REMOVED***',
  api_secret: '***REMOVED***',
});

cloudinary.api.usage(function(error, result) {
  if (error) {
    console.error('Cloudinary SDK usage report error:', error);
  } else {
    console.log('Cloudinary SDK usage report:', result);
  }
}); 