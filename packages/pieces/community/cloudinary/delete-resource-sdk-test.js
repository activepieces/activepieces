const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Replace with the public_id of the resource you want to delete
const publicId = 'sample_gkoqxl';

cloudinary.uploader.destroy(publicId, { resource_type: 'image' }, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK delete error:', error);
  } else {
    console.log('Cloudinary SDK delete result:', result);
  }
}); 