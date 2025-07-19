const axios = require('axios');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Example: List resources (images)
const endpoint = `/resources/image`;
const method = 'GET';
const params = {
  max_results: 5
};

const url = `https://api.cloudinary.com/v1_1/${cloudName}${endpoint}`;

async function customApiCall() {
  try {
    const auth = {
      username: apiKey,
      password: apiSecret,
    };
    const response = await axios({
      url,
      method,
      auth,
      params: method === 'GET' ? params : undefined,
      data: method !== 'GET' ? params : undefined,
    });
    console.log('Custom API call result:', response.data);
  } catch (e) {
    console.error('Custom API call error:', e.response?.data || e.message);
  }
}

customApiCall(); 