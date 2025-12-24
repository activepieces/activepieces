# Fiserv Banking API Integration

Activepieces integration for Fiserv Banking API focused on account opening workflows for consumer and commercial banking.

## Features

### Account Management
- Create deposit and loan accounts
- Retrieve account information
- Update account details
- Manage overdraft, term deposits, and interest settings

### Party/Customer Management
- Create and manage parties (persons and organizations)
- Add, update, and delete addresses
- Manage phone numbers and email addresses

### Loan Operations
- Add and manage collateral for secured loans
- Create and manage escrow accounts

## Installation

```bash
npm install @vqnguyen1/piece-fiserv
```

Or install directly in Activepieces via the UI or API.

## Authentication

This piece uses Custom Authentication with the following credentials:

- **Base URL**: Your Fiserv API base URL (e.g., `https://api.fiservapps.com`)
- **Organization ID**: Your Fiserv organization/institution ID
- **API Key**: Your Fiserv API key

## Usage Examples

### Create a Customer (Party)

1. Add the "Party - Create" action to your flow
2. Configure authentication
3. Fill in party details (name, tax ID, etc.)
4. Run the flow

### Open a New Account

1. First create a party using "Party - Create"
2. Use "Account - Create" action
3. Link the party to the account
4. Configure account type and details

### Create a Loan with Collateral

1. Create a party
2. Create a loan account
3. Add collateral using "Collateral - Add"
4. Link collateral to the loan

## Available Actions

### Accounts (6 actions)
- Account - Create
- Account - Get
- Account - Update
- Account - Update Overdraft
- Account - Update Term Deposit
- Account - Update Interest Deposit

### Parties (9 actions)
- Party - Create
- Party - Get
- Party - Update
- Party - Add Address
- Party - Update Address
- Party - Delete Address
- Party - Add Phone
- Party - Delete Phone
- Party - Add/Delete Email

### Loans (8 actions)
- Collateral - Add
- Collateral - Get
- Collateral - Update
- Collateral - Delete
- Escrow - Add
- Escrow - Get
- Escrow - Update
- Escrow - Delete

## Support

For issues or questions:
- GitHub: [activepieces/activepieces](https://github.com/activepieces/activepieces)
- Documentation: See `IMPLEMENTATION_GUIDE.md` in the docs folder

## License

MIT
