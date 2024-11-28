# Instasent

## Description
Instasent piece for ActivePieces. Enables integration with Instasent's Ingest API for managing contacts and tracking events in your data source. This API allows organizations to consolidate customer data and track interactions, enabling advanced audience segmentation and personalized marketing.

### Key Features
- **Contact Management**: Create, update, and delete contacts in your audience
- **Event Tracking**: Record customer interactions and behaviors
- **Data Consolidation**: Unify customer data from various sources
- **Automatic Attribution**: Track which marketing campaigns lead to specific events

## Authentication
This piece requires:
- **Project ID**: Your Instasent project identifier
- **Datasource ID**: Your data source identifier within the project
- **API Key**: Bearer token for authentication (specific to the data source)

To generate your authentication data go to your project and add an ActivePieces data source, if it's not available you can create an Instasent API data source instead.

## Actions

### 1. Add or Update Contact
Add new contacts or update existing ones in your data source. Supports various contact attributes:
- Basic info (name, email, phone)
- Demographics (country, language, gender)
- Marketing preferences
- Custom attributes

### 2. Delete Contact
Remove a contact from your data source. Contacts will be permanently destroyed and removed from your audience.

### 3. Add Event
Record contact events such as:
- E-commerce actions (orders, checkouts)
- User behaviour (views, form submissions...)
- Appointments or reservations
- Payments and refunds
- Metrics
- Custom events

Events support attribution parameters to track which marketing campaigns led to specific actions.

## Links
- [Instasent Website](https://instasent.com)
- [Ingest API Docs](https://app.swaggerhub.com/apis-docs/Instasent/instasent-ingest_api/)
- [Instasent APIs](https://docs.instasent.com)

## Support
For support or questions about the API, contact:
- Email: dev@instasent.com
- Website: https://instasent.com
- Customer support: https://help.instasent.com
