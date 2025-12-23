# IceMortgage Encompass

This is an Activepieces custom piece for integrating with ICE Mortgage Technology's Encompass API (formerly Ellie Mae).

## Features

- **Create Loan**: Create new loans with full loan data or using templates
- **Retrieve Loan**: Get complete loan information by loan ID
- **Update Loan**: Update existing loans with support for templates
- **Delete Loan**: Remove loans from the system
- **Manage Field Locks**: Add, remove, or replace field locks on loan fields

## Authentication

This piece uses OAuth2 Client Credentials authentication. You will need:

- **API Base URL**: Your Encompass API endpoint (e.g., `https://api.elliemae.com`)
- **Client ID**: Your OAuth2 client ID
- **Client Secret**: Your OAuth2 client secret
- **Instance ID**: Your Encompass instance ID

## Actions

### Create Loan
Create a new loan with borrower, property, and other loan details. Supports applying templates during creation.

### Retrieve Loan
Fetch complete loan information using the loan ID.

### Update Loan
Update existing loan fields. Supports applying loan program templates, closing cost templates, or template sets.

### Delete Loan
Permanently delete a loan from Encompass.

### Manage Field Locks
Control field locking on loan fields. Supports three operations:
- **Add**: Lock additional fields
- **Remove**: Unlock specific fields
- **Replace**: Replace all locked fields with a new set

## API Documentation

Based on Encompass Developer Connect API v3. For more details, refer to the official Encompass API documentation.

## Version

0.0.1

## License

MIT
