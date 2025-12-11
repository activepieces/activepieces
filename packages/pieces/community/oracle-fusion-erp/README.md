# Oracle Fusion Cloud ERP

Integrate with Oracle Fusion Cloud ERP for financial and HR operations.

## Authentication

This piece uses OAuth2 Client Credentials flow. You'll need:

- **Base URL**: Your Oracle Fusion Cloud instance URL (e.g., `https://your-instance.fa.us2.oraclecloud.com`)
- **Client ID**: OAuth2 Client ID from Oracle Cloud
- **Client Secret**: OAuth2 Client Secret from Oracle Cloud

## Actions

### Get Employee
Retrieve employee/worker information by Worker ID.

### Create Payables Invoice
Create a new payables invoice with supplier, amount, date, and currency.

### Get Purchase Order
Retrieve purchase order information by PO ID.

### Custom API Call
Make any API call to Oracle Fusion REST endpoints.

## API Reference

This piece uses the Oracle Fusion Cloud REST API:
- Base endpoint: `{baseUrl}/fscmRestApi/resources/latest/`
- [Oracle Fusion Cloud REST API Documentation](https://docs.oracle.com/en/cloud/saas/financials/23d/farfa/)
