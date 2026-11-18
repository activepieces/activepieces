import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseRunCardQueryOutputSchema } from '../../output-schemas';

export const runCardQueryAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_run_card_query',
  outputSchema: metabaseRunCardQueryOutputSchema,
  displayName: 'Run Card Query',
  description: 'Run a saved question and return its result rows.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Runs a saved question (card) and returns its rows and columns. Filters are passed by parameter slug, from the `parameters` of Get Card; an unknown slug fails the call. Read-only.',
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description:
        'Filter values keyed by parameter slug, e.g. {"category": "Gizmo"}. Empty = no filters.',
      required: false,
    }),
    ignoreCache: Property.Checkbox({
      displayName: 'Ignore Cache',
      description: 'Re-run the query instead of returning a cached result.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const values = propsValue.parameters ?? {};
    const slugs = Object.keys(values);
    const cardParameters =
      slugs.length > 0
        ? (await metabaseApi.getCard({ auth, cardId: propsValue.cardId }))
            .parameters ?? []
        : [];
    const unknownSlugs = slugs.filter(
      (slug) => !cardParameters.some((param) => param.slug === slug)
    );
    if (unknownSlugs.length > 0) {
      throw new Error(
        `Unknown parameter slug(s): ${unknownSlugs.join(
          ', '
        )}. This card accepts: ${
          cardParameters.map((param) => param.slug).join(', ') ||
          'no parameters'
        }.`
      );
    }
    return await metabaseApi.runCardQuery({
      auth,
      cardId: propsValue.cardId,
      ignoreCache: propsValue.ignoreCache ?? false,
      parameters: cardParameters
        .filter((param) => slugs.includes(param.slug))
        .map((param) => ({
          id: param.id,
          type: param.type,
          target: param.target,
          value: values[param.slug],
        })),
    });
  },
});
