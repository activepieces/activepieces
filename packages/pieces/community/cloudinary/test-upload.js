const { uploadResource } = require('./dist/lib/actions/upload-resource');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Replace with your actual API key and secret
const apiKey = process.env.CLOUDINARY_API_KEY || '***REMOVED***';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '***REMOVED***';
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'de7qxfvjd';
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default'; // Set your unsigned preset name here

// Path to a sample file to upload
const filePath = path.join(__dirname, 'sample.jpg'); // Place a sample.jpg in the same directory

async function testUpload() {
  if (!fs.existsSync(filePath)) {
    console.error('Sample file not found:', filePath);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('file', fileBuffer, 'sample.jpg');
  formData.append('upload_preset', uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  try {
    const response = await axios.post(url, formData, {
      headers: formData.getHeaders(),
    });
    console.log('Upload result:', response.data);
  } catch (e) {
    console.error('Error uploading:', e.response?.data || e.message);
  }
}

testUpload(); 