import { createAction, Property } from '@activepieces/pieces-framework';
import { duneAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface QueryMetadataResponse {
  query_id: number;
  name: string;
  description: string;
  tags: string[];
  owner: string;
  created_at: string;
  updated_at: string;
  query_sql: string;
  is_private: boolean;
}

export const getQueryMetadata = createAction({
  name: 'get_query_metadata',
  displayName: 'Get Query Metadata',
  description:
    'Fetch metadata and information about a specific Dune query.',
  auth: duneAuth,
  requireAuth: true,
  props: {
    query_id: Property.ShortText({
      displayName: 'Query ID',
      description: 'The Dune query ID to fetch metadata for.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await duneRequest<QueryMetadataResponse>(
      auth as string,
      `/query/${propsValue.query_id}`
    );

    return {
      query_id: data.query_id,
      name: data.name,
      description: data.description,
      owner: data.owner,
      tags: data.tags,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_private: data.is_private,
    };
  },
});
