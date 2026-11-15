import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { deepgramProps } from '../../common/props';
import { billingOutputSchema } from '../../output-schemas';
import {
  getBillingBreakdown,
  getBillingBreakdownAction,
} from '../get-billing-breakdown';

const { project: _project, ...originalProps } = getBillingBreakdownAction.props;

export const getBillingBreakdownAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_get_billing_breakdown',
  classification: 'READ',
  displayName: 'Get Cost Breakdown (Agent)',
  description:
    'Gets what a Deepgram project spent in dollars for a date range, optionally grouped.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the dollar cost of a Deepgram project for a date range, split per day or grouped by line item (for example streaming::nova-3), API key, deployment or tag, plus the total. Valid line items, keys and tags come from deepgram_list_billing_fields; use deepgram_get_usage_breakdown for hours and requests. Needs an admin or owner key. Read-only.',
    idempotent: true,
  },
  outputSchema: billingOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    ...originalProps,
  },
  async run(context) {
    const { project_id, ...input } = context.propsValue;
    return getBillingBreakdown({
      apiKey: context.auth.secret_text,
      input: { ...input, project: project_id ?? undefined },
    });
  },
});
