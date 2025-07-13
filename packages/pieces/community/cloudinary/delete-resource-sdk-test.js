const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'de7qxfvjd',
  api_key: '***REMOVED***',
  api_secret: '***REMOVED***',
});

// Replace with the public_id of the resource you want to delete
const publicId = 'sample_ysizwh';

cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK delete error:', error);
  } else {
    console.log('Cloudinary SDK delete result:', result);
  }
}); 