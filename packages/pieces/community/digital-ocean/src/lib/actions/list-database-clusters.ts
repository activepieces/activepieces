import { createAction, Property } from '@activepieces/pieces-framework';
import { digitalOceanAuth, DigitalOceanAuthValue } from '../common/auth';
import { digitalOceanApiCall, getAuthFromValue } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listDatabaseClusters = createAction({
  auth: digitalOceanAuth,
  name: 'list_database_clusters',
  displayName: 'List Database Clusters',
  description: 'Retrieve a list of all database clusters in your account.',
  props: {
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Filter database clusters by a specific tag.',
      required: false,
    }),
  },
  async run(context) {
    const { tag_name } = context.propsValue;

    const query: Record<string, string | number | boolean | undefined> = {};
    if (tag_name) {
      query['tag_name'] = tag_name;
    }

    const response = await digitalOceanApiCall<{
      databases: Array<{
        id: string;
        name: string;
        engine: string;
        version: string;
        num_nodes: number;
        size: string;
        region: string;
        status: string;
        created_at: string;
        private_network_uuid: string;
        tags: string[] | null;
        db_names: string[] | null;
        connection: object;
        private_connection: object;
        users: object[] | null;
        maintenance_window: object | null;
        storage_size_mib: number;
      }>;
    }>({
      method: HttpMethod.GET,
      path: '/databases',
      auth: getAuthFromValue(context.auth as DigitalOceanAuthValue),
      query: Object.keys(query).length > 0 ? query : undefined,
    });

    return response;
  },
});
