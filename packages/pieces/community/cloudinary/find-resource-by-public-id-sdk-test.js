const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use the public_id of the most recently uploaded resource
const publicId = 'sample_gkoqxl';

cloudinary.api.resource(publicId, { resource_type: 'image' }, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK find error:', error);
  } else {
    console.log('Cloudinary SDK find result:', result);
  }
}); 