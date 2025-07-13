const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Poll for resources (images) with tags added in the last N minutes
const MINUTES = 10;
const since = new Date(Date.now() - MINUTES * 60 * 1000);

cloudinary.api.resources({
  type: 'upload',
  resource_type: 'image',
  max_results: 20,
  direction: 'desc',
}, function(error, result) {
  if (error) {
    console.error('Cloudinary SDK poll tags error:', error);
  } else {
    const taggedResources = result.resources.filter(r => r.tags && r.tags.length > 0 && new Date(r.created_at) > since);
    console.log(`Resources with tags added in the last ${MINUTES} minutes:`);
    taggedResources.forEach(r => {
      console.log(`- ${r.public_id} (tags: ${r.tags.join(', ')}, created at: ${r.created_at})`);
    });
    if (taggedResources.length === 0) {
      console.log('No new tags found on resources.');
    }
  }
}); 