const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api.usage(function(error, result) {
  if (error) {
    console.error('Cloudinary SDK usage report error:', error);
  } else {
    console.log('Cloudinary SDK usage report:', result);
  }
}); 