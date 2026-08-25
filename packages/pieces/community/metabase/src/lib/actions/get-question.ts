import { createAction, Property } from '@activepieces/pieces-framework';
import { queryMetabaseApi } from '../common';
import { metabaseAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';

interface MetabaseParam {
  id: string;
  target: unknown[];
  type: string[];
  slug: string;
}

export const getQuestion = createAction({
  name: 'getQuestion',
  auth: metabaseAuth,
  requireAuth: true,
  displayName: 'Get question',
  description: 'Fetch the results of a Metabase question',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a saved Metabase question (card) by its ID and returns the query result rows. Use to pull live data from an existing report rather than writing raw SQL. Optionally pass a parameters object (keyed by parameter slug) to filter the query; slugs not defined on the card are ignored. Read-only and idempotent — re-running with the same inputs re-executes the query without side effects.',
    idempotent: true,
  },
  props: {
    questionId: Property.ShortText({
      displayName: 'Metabase question ID',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Parameters (slug name -> value)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const questionId = propsValue.questionId.split('-')[0];
    const card = await queryMetabaseApi(
      { endpoint: `card/${questionId}`, method: HttpMethod.GET },
      auth
    );
    const parameters = card['parameters'] as MetabaseParam[];

    const response = await queryMetabaseApi(
      {
        endpoint: `card/${questionId}/query`,
        method: HttpMethod.POST,
        body: {
          collection_preview: false,
          ignore_cache: false,
          parameters: parameters
            .filter(
              (param) =>
                propsValue.parameters &&
                propsValue.parameters[param.slug] !== undefined
            )
            .map((param) => {
              return {
                id: param.id,
                target: param.target,
                type: param.type,
                value:
                  propsValue.parameters && propsValue.parameters[param.slug],
              };
            }),
        },
      },
      auth
    );
    if (response.error) {
      throw new Error(response.error);
    } else {
      return response;
    }
  },
});
