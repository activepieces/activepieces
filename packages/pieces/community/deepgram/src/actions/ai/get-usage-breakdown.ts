import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { deepgramProps } from '../../common/props';
import { usageOutputSchema } from '../../output-schemas';
import { getUsageBreakdown, getUsageAction } from '../get-usage';

const { project: _project, ...originalProps } = getUsageAction.props;

export const getUsageBreakdownAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_get_usage_breakdown',
  classification: 'READ',
  displayName: 'Get Usage Breakdown (Agent)',
  description:
    'Gets audio hours, requests, characters and tokens used by a Deepgram project, optionally grouped.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns usage totals of a Deepgram project for a date range (audio hours, requests, text-to-speech characters, tokens), split per day or grouped by endpoint, model, method, tag, key, feature set or deployment. Valid tag values come from deepgram_list_usage_fields. Use deepgram_get_billing_breakdown for dollars. Read-only.',
    idempotent: true,
  },
  outputSchema: usageOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    ...originalProps,
  },
  async run(context) {
    const { project_id, ...input } = context.propsValue;
    return getUsageBreakdown({
      apiKey: context.auth.secret_text,
      input: { ...input, project: project_id ?? undefined },
    });
  },
});
