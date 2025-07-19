const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const filePath = path.join(__dirname, 'sample.jpg');

cloudinary.uploader.upload(filePath, { resource_type: 'auto' }, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK error:', error);
  } else {
    console.log('Cloudinary SDK upload result:', result);
  }
}); 