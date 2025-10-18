# ServiceNow Piece

This piece provides integration with ServiceNow, a cloud-based platform for IT service management (ITSM), operations, HR, security, and custom business workflows.

## Features

### Triggers
- **New Record**: Triggers when a new record is created in a specified ServiceNow table
- **Updated Record**: Triggers when an existing record in a table is updated

### Actions
- **Create Record**: Create a record in a specified table with provided fields
- **Update Record**: Update an existing record's fields (by ID or filter)
- **Get Record**: Gets specific table record by sys_id
- **Attach File to Record**: Upload a file and attach it to a record in a table
- **Find Record**: Lookup a record in a specific table using query parameters
- **Find File**: Find a file (attachment) by filename

## Authentication

The piece uses basic authentication with your ServiceNow credentials:
- **Instance URL**: Your ServiceNow instance URL (e.g., https://your-instance.service-now.com)
- **Username**: Your ServiceNow username
- **Password**: Your ServiceNow password or API key

For API access, ensure your user has the 'snc_platform_rest_api_access' role.

## Getting Started

1. Set up your ServiceNow developer instance at https://developer.servicenow.com/dev.do
2. Create a user with appropriate roles for API access
3. Configure the authentication in Activepieces with your credentials
4. Start building your automations!

## Common Use Cases

- **Incident Management**: Automatically create incidents from external systems
- **Change Management**: Track and manage change requests
- **Asset Management**: Sync asset information across systems
- **Document Management**: Attach files and documents to records
- **Notifications**: Get notified when records are created or updated

## API Reference

- [ServiceNow REST API Documentation](https://developer.servicenow.com/dev.do#!/reference/api/rome/rest/c_TableAPI)
- [ServiceNow Table API](https://developer.servicenow.com/dev.do#!/reference/api/rome/rest/c_TableAPI)
- [ServiceNow Attachment API](https://developer.servicenow.com/dev.do#!/reference/api/rome/rest/c_AttachmentAPI)
