# Sageworks Piece

Sageworks integration for ActivePieces - comprehensive API integration for loan servicing and document management.

## Features

### Customer Management (6 actions)
- List Customers
- Create Customer
- Get Customer by ID
- Get Customer by CRM Identifier
- Update Customer
- Delete Customer

### Portfolio Loans (5 actions)
- List Portfolio Loans
- Create Portfolio Loan
- Get Portfolio Loan
- Update Portfolio Loan
- Delete Portfolio Loan

### Proposed Loans (6 actions)
- List Proposed Loans
- Create Proposed Loan
- Get Proposed Loan
- Get Proposed Loan by CRM Identifier
- Update Proposed Loan
- Delete Proposed Loan

### Collaterals (6 actions)
- List Collaterals
- List Collateral Basic Information
- Create Collateral
- Get Collateral
- Update Collateral
- Delete Collateral

### Documents (7 actions)
- List Documents
- List Documents by Association
- Create/Upload Document
- Get Document (metadata)
- Get Document Content (base64)
- Update Document
- Delete Document

### Document Folders (4 actions)
- List Document Folders
- Create Document Folder
- Get Document Folder
- Update Document Folder

### Document Associations (5 actions)
- List Document Associations
- Create Document Association
- Get Document Association
- Update Document Association
- Delete Document Association

### Custom API Call
Make custom API calls to any Sageworks endpoint not covered by specific actions.

## Authentication

The piece uses OAuth 2.0 Client Credentials flow. You need:
- **Client ID**: Your Sageworks API client ID
- **Client Secret**: Your Sageworks API client secret
- **Base URL**: Usually `https://api.sageworks.com`

Contact Sageworks support to request API credentials.

## Version History

- **0.0.1**: Initial release with 39 actions covering all major Sageworks API endpoints

## Author

vqnguyen1
