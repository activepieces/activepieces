# PandaDoc

PandaDoc is a document automation platform that streamlines document creation, approval, and e-signature workflows. This piece allows you to automate document generation, manage contacts, and track document status changes within your Activepieces flows.

## Actions

- **Create Document from Template**: Generate new documents from existing PandaDoc templates
- **Create Attachment**: Upload files to attach to documents
- **Create or Update Contact**: Add or modify contact information in PandaDoc
- **Find Document**: Search for documents by various criteria
- **Get Document Attachments**: Retrieve all attachments from a document
- **Get Document Details**: Fetch complete information about a specific document
- **Download Document**: Download a document in PDF format
- **Custom API Call**: Make direct API calls to PandaDoc endpoints

## Triggers

- **Document Completed**: Triggered when a document reaches completed status
- **Document State Changed**: Triggered when a document status changes
- **Document Updated**: Triggered when document details are modified

## Authentication

This piece uses API Key authentication. To get your API key:

1. Log in to your PandaDoc account at https://app.pandadoc.com
2. Navigate to **Settings** → **Integrations** → **API**
3. Generate or copy your API Key
4. Paste the API key into the authentication field in Activepieces

## Use Cases

- Automatically generate contracts from customer data
- Send documents for signature when deals close in your CRM
- Track document status and notify teams when signatures are complete
- Create quotes and proposals from form submissions
- Manage client contacts across multiple systems

## Documentation

For more information about PandaDoc API capabilities, visit:
- [PandaDoc API Documentation](https://developers.pandadoc.com/reference/about)
- [API Reference](https://developers.pandadoc.com/reference/list-documents)

## Building

Run `nx build pieces-pandadoc` to build the library.
