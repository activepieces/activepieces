const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Poll for new resources (images) uploaded in the last N minutes
const MINUTES = 10;
const since = new Date(Date.now() - MINUTES * 60 * 1000);

cloudinary.api.resources({
  type: 'upload',
  resource_type: 'image',
  max_results: 10,
  direction: 'desc',
}, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK poll error:', error);
  } else {
    const newResources = result.resources.filter(r => new Date(r.created_at) > since);
    console.log(`Resources uploaded in the last ${MINUTES} minutes:`);
    newResources.forEach(r => {
      console.log(`- ${r.public_id} (created at: ${r.created_at})`);
    });
    if (newResources.length === 0) {
      console.log('No new resources found.');
    }
  }
}); 