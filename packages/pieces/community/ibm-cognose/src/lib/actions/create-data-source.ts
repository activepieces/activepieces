import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';

export const createDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'create_data_source',
  displayName: 'Create Data Source',
  description: 'Create a new data source',
  props: {
    defaultName: Property.ShortText({
      displayName: 'Data Source Name',
      description: 'Name for the new data source',
      required: true,
    }),
    connectionString: Property.LongText({
      displayName: 'Connection String',
      description: 'JDBC URL or database connection string',
      required: true,
      defaultValue: 'jdbc:db2://localhost:50000/SAMPLE',
    }),
    driverName: Property.ShortText({
      displayName: 'Driver Name',
      description: 'Database driver class name',
      required: false,
      defaultValue: 'com.ibm.db2.jcc.DB2Driver',
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
      description: 'Name for the database credentials',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { defaultName, connectionString, driverName, username, password, signonDefaultName } = propsValue;

    try {
      const client = new CognosClient(auth.props);

      const dataSourceDefinition: any = {
        defaultName,
        connections: [
          {
            connectionString,
            defaultName: defaultName + '_connection',
          }
        ]
      };

      if (driverName) {
        dataSourceDefinition.connections[0].connectionString += `;DRIVER_NAME=${driverName}`;
      }

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

      const response = await client.makeAuthenticatedRequest('/dataSources', HttpMethod.POST, dataSourceDefinition);

      if (response.status === 201) {
        return {
          success: true,
          message: `Data source '${defaultName}' created successfully`,
          dataSource: response.body,
        };
      } else if (response.status === 400) {
        throw new Error(`Data source '${defaultName}' already exists or invalid parameters`);
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else {
        throw new Error(`Failed to create data source: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to create data source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});