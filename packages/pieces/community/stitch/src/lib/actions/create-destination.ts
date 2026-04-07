import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, StitchDestination } from '../common';

const DESTINATION_TYPES = [
  { label: 'Amazon Redshift', value: 'redshift' },
  { label: 'Amazon S3', value: 'amazon_s3' },
  { label: 'Databricks Delta Lake', value: 'databricks_delta_lake' },
  { label: 'Google BigQuery', value: 'bigquery' },
  { label: 'Microsoft Azure Synapse Analytics', value: 'azure_synapse_analytics' },
  { label: 'PostgreSQL', value: 'postgres' },
  { label: 'Panoply', value: 'panoply' },
  { label: 'Snowflake', value: 'snowflake' },
];

export const createDestinationAction = createAction({
  auth: stitchAuth,
  name: 'create_destination',
  displayName: 'Create Destination',
  description: 'Connects a new data warehouse destination to your Stitch account.',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Destination Type',
      description: 'The type of data warehouse to connect.',
      required: true,
      options: {
        options: DESTINATION_TYPES,
      },
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'A human-readable name for this destination (e.g. "Production BigQuery").',
      required: true,
    }),
    properties: Property.Json({
      displayName: 'Connection Properties',
      description:
        'Destination-specific configuration as a JSON object. ' +
        'Fields differ per destination type. For example, for PostgreSQL: ' +
        '{"host":"db.example.com","port":5432,"username":"stitch","password":"...","database":"analytics","ssl":true}. ' +
        'See the Stitch docs for the required fields for your destination type.',
      required: true,
      defaultValue: {},
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const destination = await makeConnectRequest<StitchDestination>(
      auth,
      HttpMethod.POST,
      '/v4/destinations',
      {
        type: context.propsValue.type,
        display_name: context.propsValue.display_name,
        properties: context.propsValue.properties,
      }
    );
    return {
      id: destination.id,
      display_name: destination.display_name,
      type: destination.type,
      stitch_client_id: destination.stitch_client_id,
      created_at: destination.created_at,
      updated_at: destination.updated_at,
    };
  },
});
