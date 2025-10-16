# IBM Cognos Analytics

IBM Cognos Analytics piece for ActivePieces.

## Authentication

This piece uses IBM Cognos Analytics REST API authentication with the following credentials:

- **Server URL**: Your Cognos Analytics server URL (e.g., https://your-server.com)
- **Namespace**: Authentication namespace (e.g., LDAP)
- **Username**: Your Cognos username
- **Password**: Your Cognos password

## Actions

### Create Data Source

Creates a new data source in IBM Cognos Analytics.

**Parameters:**
- **Data Source Name** (required): The name for the new data source
- **Connection String** (required): The connection string for the data source (e.g., JDBC URL, database connection details)
- **Driver Name** (optional): The database driver name (e.g., com.ibm.db2.jcc.DB2Driver)
- **Database Username** (optional): Username for database connection
- **Database Password** (optional): Password for database connection
- **Signon Name** (optional): Name for the database credentials

**Example Connection Strings:**
- DB2: `jdbc:db2://localhost:50000/SAMPLE`
- Oracle: `jdbc:oracle:thin:@localhost:1521:XE`
- SQL Server: `jdbc:sqlserver://localhost:1433;databaseName=MyDB`

**Returns:**
- Success message and created data source details

### Get Data Source

Retrieves the details of a specific data source from IBM Cognos Analytics.

**Parameters:**
- **Data Source** (required): Select the data source to retrieve from a dropdown list
- **Extra Fields** (optional): Comma-separated list of extra fields to retrieve (e.g., "connections,signons")

**Returns:**
- Complete data source object with all details including:
  - ID, name, type, version
  - Capabilities and permissions
  - Modification time
  - Hidden/disabled status
  - Additional fields if requested

### Update Data Source

Updates an existing data source in IBM Cognos Analytics.

**Parameters:**
- **Data Source** (required): Select the data source to update from a dropdown list
- **Data Source Name** (optional): The new name for the data source
- **Disabled** (optional): Whether the data source should be disabled (checkbox)
- **Hidden** (optional): Whether the data source should be hidden (checkbox)

**Returns:**
- Success message and details of updated fields

**Note:** At least one field must be provided to update the data source.

### Delete Data Source

Deletes an existing data source from IBM Cognos Analytics.

**Parameters:**
- **Data Source** (required): Select the data source to delete from a dropdown list

**Returns:**
- Success message confirming deletion

**Note:** This action permanently deletes the data source. Use with caution.

## Content Object Management

### Get Content Object

Retrieves the details of a specific content object from IBM Cognos Analytics.

**Parameters:**
- **Content Object** (required): Select the content object to retrieve from a dropdown list
- **Extra Fields** (optional): Comma-separated list of extra fields to retrieve (e.g., "owner,permissions,children")

**Returns:**
- Complete content object with all details including:
  - ID, name, type, version
  - Owner information
  - Modification time
  - Links and relationships
  - Additional fields if requested

### Update Content Object

Updates an existing content object in IBM Cognos Analytics (reports, dashboards, folders, etc.).

**Parameters:**
- **Content Object** (required): Select the content object to update from a dropdown list
- **Default Name** (optional): The new default name for the content object
- **Default Descriptions** (optional): The new default descriptions for the content object
- **Type** (optional): The type of the content object (e.g., report, dashboard, folder)
- **Version** (optional): The version number of the content object

**Returns:**
- Success message and details of updated fields

**Error Handling:**
- **409 Conflict**: Object has changed since you fetched it (version conflict)
- **404 Not Found**: Content object doesn't exist
- **401 Unauthorized**: Authentication required

**Note:** At least one field must be provided to update the content object.

### Move Content Object

Moves a content object with all its descendants to a new location in IBM Cognos Analytics.

**Parameters:**
- **Content Object** (required): Select the content object to move from a dropdown list
- **Destination Container** (required): Select the destination container where the object will be moved

**Returns:**
- Success message with source and destination IDs

**Error Handling:**
- **400 Bad Request**: Invalid move operation
- **403 Permission Denied**: Insufficient permissions to move the object
- **404 Not Found**: Source or destination object not found
- **401 Unauthorized**: Authentication required

**Note:** The move operation includes all descendants (child objects) of the source object.

### Copy Content Object

Copies a content object optionally with all its descendants to a new location in IBM Cognos Analytics.

**Parameters:**
- **Content Object** (required): Select the content object to copy from a dropdown list
- **Destination Container** (required): Select the destination container where the object will be copied
- **Recursive Copy** (optional): Whether to copy all descendants (child objects) as well (default: true)

**Returns:**
- Success message with source and destination IDs
- Details of the copied object including its new ID

**Error Handling:**
- **400 Bad Request**: Invalid copy operation
- **403 Permission Denied**: Insufficient permissions to copy the object
- **404 Not Found**: Source or destination object not found
- **401 Unauthorized**: Authentication required

**Note:** When recursive copy is enabled, all child objects are copied along with the parent object.

## User Experience Improvements

- **Dynamic Dropdowns**: Data source and content object actions feature dynamic dropdowns that automatically populate with available items from your Cognos Analytics server
- **Real-time Data**: The dropdowns refresh to show current data sources and content objects, including their names, types, and IDs for easy identification
- **Error Handling**: Clear error messages for authentication issues and missing data sources

## Custom API Call Action

The piece also includes a custom API call action that allows you to make authenticated requests to any IBM Cognos Analytics REST API endpoint.

## Building

Run `nx build pieces-ibm-cognose` to build the library.