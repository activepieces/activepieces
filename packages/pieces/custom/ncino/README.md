# nCino Loan Management Integration

This piece integrates with the nCino API for managing loan applications and loan borrowers.

## Authentication

The nCino piece uses OAuth2 authentication with the following properties:

- **Base URL**: The base URL for the nCino API (e.g., https://api.ncino.com)
- **Client ID**: Your nCino OAuth2 Client ID
- **Client Secret**: Your nCino OAuth2 Client Secret
- **Access Token**: OAuth2 access token (optional, can be provided per action)

## Available Actions

### List Loans
Retrieve all loans.

**Inputs:**
- Access Token (optional): OAuth2 access token (overrides auth if provided)
- Limit (optional): Maximum number of results (default: 25)
- Offset (optional): Number of results to skip (default: 0)

**Returns:** List of loans

### Get Loan
Retrieve a specific loan by ID.

**Inputs:**
- Access Token (optional): OAuth2 access token
- Loan ID (required): The ID of the loan to retrieve

**Returns:** Loan details

### Create Loan Borrower
Create a new loan borrower record.

**Inputs:**
- Access Token (optional): OAuth2 access token
- Borrower Data (required): Loan borrower information as JSON

**Returns:** Created borrower record

### List Loan Borrowers
Retrieve all loan borrowers.

**Inputs:**
- Access Token (optional): OAuth2 access token
- Limit (optional): Maximum number of results (default: 25)
- Offset (optional): Number of results to skip (default: 0)

**Returns:** List of loan borrowers

### Get Loan Borrower
Retrieve a specific loan borrower by ID.

**Inputs:**
- Access Token (optional): OAuth2 access token
- Borrower ID (required): The ID of the borrower to retrieve

**Returns:** Borrower details

### Update Loan Borrower
Update an existing loan borrower.

**Inputs:**
- Access Token (optional): OAuth2 access token
- Borrower ID (required): The ID of the borrower to update
- Borrower Data (required): Updated borrower information as JSON

**Returns:** Updated borrower record

### Custom API Call
Make a custom API call to any nCino endpoint.

**Inputs:**
- URL (required): Full URL or relative path
- Method (required): HTTP method
- Headers (optional): Custom headers
- Query Parameters (optional): URL query parameters
- Body (optional): Request body as JSON

**Returns:** API response

**Note:** Authorization Bearer token is automatically injected if access token is configured.

## Usage Example

1. Obtain OAuth2 access token from nCino
2. Configure authentication with your credentials and access token
3. Use List Loans to retrieve available loans
4. Use Create Loan Borrower to add borrowers to loans
5. Use Update Loan Borrower to modify borrower information

## API Documentation

For more information about the nCino API:
https://developer.ncino.com/

## Version

Current version: 0.0.1

## Author

vqnguyen1
