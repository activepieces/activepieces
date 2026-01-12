import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const getFunnel = createAction({
  auth: lightfunnelsAuth,
  name: 'get_funnel',
  displayName: 'Get Funnel',
  description: 'Retrieve a specific funnel by ID',
  props: {
    funnelId: Property.ShortText({
      displayName: 'Funnel ID',
      description: 'The ID of the funnel to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { funnelId } = context.propsValue;

    const graphqlQuery = `
      query FunnelQuery($id: ID!) {
        node(id: $id) {
          ... on Funnel {
            id
            _id
            name
            slug
            published
            created_at
            updated_at
          }
        }
      }
    `;

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      { id: funnelId }
    );

    return response.data.node;
  },
});
