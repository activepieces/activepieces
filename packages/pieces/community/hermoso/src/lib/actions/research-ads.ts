import { createAction, Property } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoApi } from '../common/client';
import { hermosoProps } from '../common/props';

export const researchAdsAction = createAction({
  auth: hermosoAuth,
  name: 'research_ads',
  classification: 'SEARCH',
  displayName: 'Research Ads',
  description:
    'Answers an open question about ads in a market, such as which angles competitors are running, with a written summary. Takes 30 to 60 seconds.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs Hermoso ad research across several ad libraries for an open question (comparisons, which angles work in a category, who else advertises this) and returns a written answer. Use Search Meta Ads for one keyword or one advertiser, which is faster. A retry of the same step in the same flow run returns the first answer.',
    idempotent: true,
  },
  props: {
    brand: hermosoProps.brand,
    question: Property.LongText({
      displayName: 'Question',
      description: 'What to research, such as "the longest-running prebiotic soda ads on Meta and the angles they use".',
      required: true,
    }),
  },
  async run(context) {
    const args = { query: context.propsValue.question.trim() };
    const { text, data } = await hermosoApi.callTool({
      apiKey: context.auth.secret_text,
      brand: context.propsValue.brand ?? undefined,
      name: 'research_ads',
      args,
      idempotencyKey: hermosoApi.idempotencyKey({
        runId: context.run.id,
        stepName: context.step.name,
        operation: 'research_ads',
        payload: args,
      }),
    });
    return { answer: text, details: data };
  },
});
