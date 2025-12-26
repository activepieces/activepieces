# Plaid KYC Integration

This piece integrates with the Plaid API for Know Your Customer (KYC) verification and identity management.

## Authentication

The Plaid piece uses custom authentication with the following properties:

- **Environment**: Plaid API environment (Sandbox, Development, Production)
- **Client ID**: Your Plaid Client ID
- **Secret**: Your Plaid Secret

## Available Actions

### Get Identity
Retrieve account holder identity information including names, emails, phone numbers, and addresses.

**Inputs:**
- Access Token (required): The access token for the Item

**Returns:** Identity data including names, emails, phone numbers, and addresses

### Match Identity
Generate a match score for identity data against financial institution records.

**Inputs:**
- Access Token (required): The access token for the Item
- User Data (required): User data to match (legal_name, phone_number, email_address, address)

**Returns:** Match scores and verification results

### Get Auth
Retrieve bank account numbers and routing numbers for checking/savings accounts.

**Inputs:**
- Access Token (required): The access token for the Item

**Returns:** Bank account and routing numbers

### Create Identity Verification
Initiate an identity verification process.

**Inputs:**
- Is Shareable URL (optional): Whether to create a shareable URL
- Template ID (required): The ID of the identity verification template
- Gave Consent (required): Whether the user gave consent
- User Data (optional): User information for verification

**Returns:** Identity verification session details

### Get Identity Verification
Retrieve the status of an identity verification.

**Inputs:**
- Identity Verification ID (required): The ID of the verification to retrieve

**Returns:** Verification status and results

### Custom API Call
Make a custom API call to any Plaid endpoint.

**Inputs:**
- URL (required): Full URL or relative path
- Method (required): HTTP method
- Headers (optional): Custom headers
- Query Parameters (optional): URL query parameters
- Body (optional): Request body as JSON

**Returns:** API response

**Note:** PLAID-CLIENT-ID and PLAID-SECRET headers are automatically injected.

## Usage Example

1. Set up authentication with your Plaid credentials
2. Use Get Identity to retrieve user identity data
3. Use Match Identity to verify the data against bank records
4. Use Create Identity Verification to initiate additional verification if needed
5. Check verification status with Get Identity Verification

## API Documentation

For more information about the Plaid API:
https://plaid.com/docs/

## Version

Current version: 0.0.1

## Author

vqnguyen1
