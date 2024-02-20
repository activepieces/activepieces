import { createAction, Property } from '@activepieces/pieces-framework';
import { queryApiAndHandleRefresh } from '../common';
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
  async run({ auth, store, propsValue }) {
    const card = await queryApiAndHandleRefresh(
      { endpoint: `card/${propsValue.questionId}`, method: HttpMethod.GET },
      auth,
      store
    );
    const parameters = card['parameters'] as MetabaseParam[];

    return queryApiAndHandleRefresh(
      {
        endpoint: `card/${propsValue.questionId}/query`,
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
      auth,
      store
    );
  },
});
