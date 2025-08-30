# Netlify Piece

This piece integrates with Netlify to provide comprehensive actions and triggers for managing sites, deployments, forms, and webhooks.

## Actions

### Site Management
- **Create Site** - Creates a new site on Netlify with custom domain, SSL, and processing settings
- **Get Site** - Retrieves information about a specific Netlify site
- **List Sites** - Returns all sites you have access to with pagination support

### Deployment Management
- **Start Deploy** - Triggers a new build for a site on Netlify with support for clearing build cache, draft deploys, branch selection, and custom titles
- **Get Deploy** - Returns a specific deploy by ID
- **List Site Deploys** - Returns a list of all deploys for a specific site with pagination support (max 100 per page)
- **Restore Deploy (Rollback)** - Restores an old deploy and makes it the live version of the site

### File Management
- **List Files** - Returns a list of all files in the current deploy or a specific deploy

### Form Management
- **List Forms** - Returns a list of all forms for a site, including metadata about each form
- **List Form Submissions** - Returns verified form submissions across all forms or for a specific form, with spam filtering and pagination

## Triggers

### Deploy Events
- **New Deploy Started** - Fires immediately when a deploy job starts on your Netlify site
- **New Deploy Succeeded** - Fires when a new site version has successfully deployed  
- **New Deploy Failed** - Fires when a site deploy fails

### Form Events
- **New Form Submission** - Fires when a Netlify form submission is received

## Authentication

This piece supports two authentication methods:

### 1. Personal Access Token (PAT) - Recommended for testing
1. Go to your Netlify user settings
2. Navigate to "Applications" → "Personal access tokens"
3. Click "New access token"
4. Enter a descriptive name
5. Select "Allow access to my SAML-based Netlify team" if needed
6. Choose an expiration date
7. Click "Generate token"
8. Copy the token and paste it in the Access Token field

### 2. OAuth2 - Required for public integrations
1. Go to your Netlify user settings
2. Navigate to "Applications" → "OAuth applications"
3. Click "New OAuth application"
4. Add `https://cloud.activepieces.com/redirect` to authorized redirect URIs
5. Copy the Client ID and Client Secret
6. Use the OAuth2 flow

**Note:** If your team uses SAML SSO, you must grant access to the team when generating your token.

## API Reference

This piece integrates with the [Netlify API](https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/) following all documented endpoints:

- **Sites API** - For creating, retrieving, and managing sites
- **Deploys API** - For managing deployments, listing files, and rollbacks
- **Forms API** - For accessing form metadata and submissions
- **Hooks API** - For webhook management in triggers

## Rate Limiting

The Netlify API has rate limits:
- **Most requests**: 500 requests per minute
- **Deployments**: 3 times per minute, 100 times per day

## Pagination

All API requests that return over 100 items are paginated by default, with a limit of 100 items per page. The piece automatically handles pagination parameters.

## Webhook Events

The piece uses the correct Netlify webhook events:
- `deploy_created` - When a new deploy starts
- `deploy_succeeded` - When a deploy completes successfully
- `deploy_failed` - When a deploy fails
- `submission_created` - When a form submission is received

## Features

- **OAuth2 & PAT Support** - Flexible authentication options
- **Webhook Management** - Automatic webhook creation/deletion for triggers
- **Error Handling** - Robust error handling with meaningful error messages
- **Rate Limiting Awareness** - Built with Netlify's API rate limits in mind
- **Production Ready** - Follows Activepieces best practices and patterns
- **Comprehensive Coverage** - Covers all major Netlify API endpoints
- **Pagination Support** - Handles large datasets efficiently
