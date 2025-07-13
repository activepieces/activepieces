const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'de7qxfvjd',
  api_key: '***REMOVED***',
  api_secret: '***REMOVED***',
});

// Use the public_id of the most recently uploaded resource
const publicId = 'sample_bdgcod';

cloudinary.api.resource(publicId, { resource_type: 'image' }, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK find error:', error);
  } else {
    console.log('Cloudinary SDK find result:', result);
  }
}); 