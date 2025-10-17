# IBM Cognos Analytics

IBM Cognos Analytics is an enterprise analytics and reporting platform that provides business intelligence capabilities.

This piece enables you to interact with IBM Cognos Analytics through its REST API to manage data sources and content objects.

## Authentication

This piece uses custom authentication with the following required parameters:

- **Base URL**: Your IBM Cognos Analytics instance URL (e.g., `https://your-instance.cognos.cloud.ibm.com`)
- **Namespace**: Your CAM namespace (e.g., `LDAP`, `Cognos`, or your custom namespace)
- **Username**: Your IBM Cognos Analytics username
- **Password**: Your IBM Cognos Analytics password

## Actions

### Data Source Actions

#### Create Data Source
Creates a new data source in IBM Cognos Analytics.

**Inputs:**
- Data Source Name (required)
- Connection String (required)
- Disabled (optional)
- Hidden (optional)

#### Update Data Source
Updates an existing data source.

**Inputs:**
- Data Source ID (required)
- Data Source Name (optional)
- Disabled (optional)
- Hidden (optional)

#### Delete Data Source
Deletes a data source from IBM Cognos Analytics.

**Inputs:**
- Data Source ID (required)
- Force Delete (optional)

#### Get Data Source
Retrieves the details of a specific data source.

**Inputs:**
- Data Source ID (required)

### Content Object Actions

#### Update Content Object
Updates an existing content object (report, dashboard, folder, etc.).

**Inputs:**
- Content Object ID (required)
- Name (optional)
- Description (optional)
- Type (optional)
- Version (optional)

#### Move Content Object
Moves a content object to a different folder.

**Inputs:**
- Content Object ID (required)
- Target Folder ID (required)
- Conflict Resolution (optional)

#### Copy Content Object
Copies a content object to a different location.

**Inputs:**
- Content Object ID (required)
- Target Folder ID (required)
- New Name (optional)
- Conflict Resolution (optional)

#### Get Content Object
Retrieves the details of a specific content object.

**Inputs:**
- Content Object ID (required)
- Include Metadata (optional)

## API Reference

For more information about the IBM Cognos Analytics REST API, visit:
https://www.ibm.com/docs/en/cognos-analytics/12.1.x?topic=api-rest-reference

## Getting Started

1. Sign up for an IBM Cognos Analytics trial at: https://www.ibm.com/products/cognos-analytics
2. Wait for your account to be activated
3. Obtain your instance URL, namespace, username, and password
4. Configure the authentication in Activepieces with these credentials
5. Start using the actions to manage your data sources and content objects

## Support

For issues or questions, please refer to:
- IBM Cognos Analytics Documentation: https://www.ibm.com/docs/en/cognos-analytics
- Activepieces Documentation: https://www.activepieces.com/docs

