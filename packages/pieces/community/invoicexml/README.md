# InvoiceXML

Activepieces piece for [InvoiceXML](https://www.invoicexml.com), the e-invoicing API for Europe. It creates, validates and converts EN 16931 e-invoices in XRechnung, ZUGFeRD, Factur-X, UBL / Peppol BIS and CII. Every invoice is validated against the official rules before it is returned.

## Authentication

Get an API key from your InvoiceXML account:

1. Sign up or log in at [www.invoicexml.com](https://www.invoicexml.com/account/signup).
2. Open **Account > Authentication** and copy your API key.

## Actions

- **Create E-Invoice**: builds an invoice file from JSON data with the [e-invoice creation API](https://www.invoicexml.com/api/create).
- **Validate E-Invoice**: checks an invoice file and lists every error and warning with the [e-invoice validation API](https://www.invoicexml.com/api/validate).
- **Convert E-Invoice**: converts an invoice file to another format with the [e-invoice conversion API](https://www.invoicexml.com/api/convert).
- **Extract Invoice Data**: reads the invoice data embedded in a ZUGFeRD or Factur-X PDF with the [invoice data extraction API](https://www.invoicexml.com/api/extract/json).
- **Render Invoice as PDF**: turns an invoice XML into a readable PDF ([render API reference](https://www.invoicexml.com/docs/api/render/xml/to/pdf)).
- **Custom API Call**: calls any InvoiceXML endpoint with your API key.

The invoice fields and every endpoint are described in the [InvoiceXML API documentation](https://www.invoicexml.com/docs).
