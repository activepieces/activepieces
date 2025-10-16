import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';

export const createDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'create_data_source',
  displayName: 'Create Data Source',
  description: 'Creates a new data source in IBM Cognos Analytics',
  props: {
    defaultName: Property.ShortText({
      displayName: 'Data Source Name',
      description: 'The name for the new data source',
      required: true,
    }),
    connectionString: Property.LongText({
      displayName: 'Connection String',
      description: 'The connection string for the data source (e.g., JDBC URL, database connection details)',
      required: true,
    }),
    driverName: Property.ShortText({
      displayName: 'Driver Name',
      description: 'The database driver name (e.g., com.ibm.db2.jcc.DB2Driver)',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Database Username',
      description: 'Username for database connection',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Database Password',
      description: 'Password for database connection',
      required: false,
    }),
    signonDefaultName: Property.ShortText({
      displayName: 'Signon Name',
      description: 'Name for the database credentials (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { defaultName, connectionString, driverName, username, password, signonDefaultName } = propsValue;

    // Create Cognos client
    const client = new CognosClient(auth);

    // Build the data source definition
    const dataSourceDefinition: any = {
      defaultName,
      connections: [
        {
          connectionString,
          defaultName: defaultName + '_connection',
        }
      ]
    };

    // Add driver name to connection string if provided
    if (driverName) {
      dataSourceDefinition.connections[0].connectionString += `;DRIVER_NAME=${driverName}`;
    }

    // Add signon credentials if username/password provided
    if (username && password) {
      dataSourceDefinition.connections[0].signons = [
        {
          defaultName: signonDefaultName || defaultName + '_signon',
          credentialsEx: {
            username,
            password
          }
        }
      ];
    }

    // Create the data source
    const response = await client.makeAuthenticatedRequest('/dataSources', HttpMethod.POST, dataSourceDefinition);

    if (response.status === 201) {
      return {
        success: true,
        message: `Data source '${defaultName}' created successfully`,
        dataSource: response.body,
      };
    } else if (response.status === 400) {
      throw new Error(`Bad request: Data source name '${defaultName}' already exists or invalid parameters`);
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else {
      throw new Error(`Failed to create data source: ${response.status} ${response.body}`);
    }
  },
});