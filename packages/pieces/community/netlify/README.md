# Netlify

Netlify is a platform for building, deploying, and managing static websites and frontend applications with continuous deployment from Git repositories.

## Authentication

This piece uses Personal Access Token authentication to connect to Netlify. You'll need to:

1. Log in to your Netlify account
2. Go to User Settings > Applications > Personal Access Tokens
3. Click "New access token"
4. Give it a descriptive name and click "Generate token"
5. Copy the token and use it in Activepieces

## Supported Actions

### Write Actions
- **Start Deploy** - Trigger a new deployment for a site
- **Get Site** - Retrieve information about a specific site
- **List Site Deploys** - Get a list of deployments for a site
- **List Files** - List files in a specific deployment

### Triggers
- **New Deploy Started** - Triggers when a new deployment begins
- **New Deploy Succeeded** - Triggers when a deployment completes successfully
- **New Deploy Failed** - Triggers when a deployment fails
- **New Form Submission** - Triggers when a form is submitted on your site

## API Documentation

For more information about the Netlify API, visit: https://docs.netlify.com/api/get-started/
