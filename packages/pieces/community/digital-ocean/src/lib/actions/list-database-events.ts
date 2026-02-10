import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listDatabaseEvents = createAction({
  auth: digitalOceanAuth,
  name: 'list_database_events',
  displayName: 'List Database Events',
  description: 'Retrieve all event logs for a database cluster.',
  props: {
    database_cluster_uuid: Property.Dropdown({
      displayName: 'Database Cluster',
      description: 'Select the database cluster.',
      required: true,
      refreshers: [],
      auth: digitalOceanAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const response = await digitalOceanApiCall<{
          databases: Array<{ id: string; name: string; engine: string }>;
        }>({
          method: HttpMethod.GET,
          path: '/databases',
          auth: getAuthFromValue(auth as DigitalOceanAuthValue),
        });

        return {
          disabled: false,
          options: response.databases.map((db) => ({
            label: `${db.name} (${db.engine})`,
            value: db.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { database_cluster_uuid } = context.propsValue;

    const response = await digitalOceanApiCall<{
      events: Array<{
        id: string;
        cluster_name: string;
        event_type: string;
        create_time: string;
      }>;
    }>({
      method: HttpMethod.GET,
      path: `/databases/${database_cluster_uuid}/events`,
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
    });

    return response;
  },
});
