# Narmi Account Opening API

This piece integrates with the Narmi Account Opening API to manage account applications.

## Authentication

The Narmi piece uses custom authentication with the following properties:

- **Base URL**: The base URL for the Narmi API (e.g., `https://api.sandbox.narmi.dev`)
- **API Key**: Your Narmi API Key (OAuth2 token) - Optional, only required for certain endpoints

## Available Actions

### Get CSRF Token
Get a CSRF token for making authenticated requests to the Narmi API.

**Inputs:**
- Has Applicant Token (optional): Whether you have an applicant_token cookie

**Returns:** CSRF token and response body

### Get Products
Get the list of available Account Opening products.

**Returns:** List of products with details like category, name, description, minimum balance, etc.

### Create Account Application
Create a new account application.

**Inputs:**
- CSRF Token (required)
- Email (required)
- First Name (optional)
- Last Name (optional)
- Phone (optional)
- Selected Products (optional): Array of product IDs
- Additional Data (optional): Additional application data as JSON

**Returns:** Created application with token

### Get Account Application
Retrieve an account application by UUID.

**Inputs:**
- Application UUID (required)
- CSRF Token (optional)

**Returns:** Application details

### Update Account Application
Update an existing account application.

**Inputs:**
- Application UUID (required)
- CSRF Token (required)
- Update Data (required): JSON object with fields to update

**Returns:** Updated application details

### Submit Application
Submit an account application for processing.

**Inputs:**
- Application UUID (required)
- CSRF Token (required)
- Selected Products (required): Array of product objects
- Device ID (optional)
- UTM Source (optional)

**Returns:** Submission response with application state

### Run KYC
Initiate KYC (Know Your Customer) execution for an account application.

**Inputs:**
- Application UUID (required)
- CSRF Token (optional)

**Returns:** KYC execution response

### Custom API Call
Make a custom API call to any Narmi endpoint.

**Inputs:**
- URL (required): Full URL or relative path to the base URL (e.g., `/v1/account_opening/`)
- Method (required): HTTP method (GET, POST, PUT, DELETE, PATCH)
- Headers (optional): Custom headers to include
- Query Parameters (optional): URL query parameters
- Body (optional): Request body as JSON
- Response is Binary (optional): Enable for file responses like PDFs
- No Error on Failure (optional): Return error message instead of throwing
- Timeout (optional): Request timeout in seconds

**Returns:** API response

**Note:** Authorization headers are automatically injected if an API key is configured.

## Usage Example

1. First, get a CSRF token using the "Get CSRF Token" action
2. Create a new account application using the CSRF token
3. Update the application with applicant information
4. Submit the application for processing
5. Optionally run KYC verification

## API Documentation

For more information about the Narmi Account Opening API, visit:
https://narmi.stoplight.io/docs/narmi-developer-docs/

## Version

Current version: 0.0.2

## Author

vqnguyen1
