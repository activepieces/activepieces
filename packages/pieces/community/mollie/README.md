# Mollie Piece

This piece integrates with Mollie, an online payment service provider, allowing you to automate payment processing, customer management, and financial operations.

## Authentication

This piece requires a Mollie API key for authentication. You can obtain your API key from your Mollie dashboard:
1. Log in to your Mollie account
2. Navigate to Developers > API keys
3. Copy your Live or Test API key

## Features

### Triggers
- **New Payment**: Triggers when a new payment is created
- **New Customer**: Triggers when a new customer is created
- **New Order**: Triggers when a new order is created
- **New Refund**: Triggers when a refund is created
- **New Settlement**: Triggers when a new settlement is created
- **New Invoice**: Triggers when a new invoice is created
- **Payment Chargeback**: Triggers when a payment is charged back

### Actions

#### Write Actions
- **Create Payment**: Create a new payment
- **Create Payment Link**: Create a shareable payment link
- **Create Customer**: Create a new customer
- **Create Payment Refund**: Create a refund for a payment

#### Search Actions
- **Search Order**: Search for orders by various criteria
- **Search Payment**: Search for payments by various criteria
- **Search Customer**: Search for customers by various criteria

## Supported Payment Methods

- iDEAL
- Credit Card
- PayPal
- Bancontact
- SOFORT Banking
- Bank Transfer
- SEPA Direct Debit
- Apple Pay
- And many more...

## Supported Currencies

EUR, USD, GBP, CAD, AUD, JPY, CHF, SEK, NOK, DKK, PLN

## Usage Examples

### Creating a Payment
Create a payment with amount, currency, description, and redirect URL. Optionally specify payment method, locale, and custom metadata.

### Creating a Customer
Register a new customer with their name and email. Useful for recurring payments and customer management.

### Processing Refunds
Create full or partial refunds for completed payments with optional description and metadata.

## API Reference

For more detailed information about the Mollie API, visit: https://docs.mollie.com/