const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'de7qxfvjd',
  api_key: '***REMOVED***',
  api_secret: '***REMOVED***',
});

// Replace with the public_id of the resource you want to transform
const publicId = 'sample_ysizwh';

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