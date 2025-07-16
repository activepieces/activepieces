const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Replace with the public_id of the resource you want to transform
const publicId = 'sample_gkoqxl';

// Example transformation: resize to width 400, height 300, crop fill
const transformation = [
  { width: 400, height: 300, crop: 'fill' }
];

const url = cloudinary.url(publicId, {
  transformation,
  secure: true,
  resource_type: 'image',
});

console.log('Transformed URL:', url); 