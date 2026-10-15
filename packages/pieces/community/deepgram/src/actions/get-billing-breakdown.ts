import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { BillingBreakdownResponse, deepgramReports } from '../common/reports';
import { billingOutputSchema } from '../output-schemas';

export const getBillingBreakdownAction = createAction({
  auth: deepgramAuth,
  name: 'get_billing_breakdown',
  classification: 'READ',
  displayName: 'Get Cost Breakdown',
  description:
    'Gets what a Deepgram project spent in dollars for a date range, optionally grouped. Needs an admin or owner API key.',
  audience: 'human',
  aiMetadata: {
    description:
      'Returns the dollar cost of a Deepgram project for a date range, split per day or grouped by line item (for example streaming::nova-3), API key, deployment or tag, plus the total. Requires an admin or owner key. Use deepgram_get_usage_breakdown for hours and requests. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: billingOutputSchema,
  props: {
    project: deepgramProps.project(),
    start: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day to include.',
      required: false,
    }),
    end: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day to include.',
      required: false,
    }),
    groupBy: Property.StaticMultiSelectDropdown({
      displayName: 'Group By',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Line item', value: 'line_item' },
          { label: 'API key (accessor)', value: 'accessor' },
          { label: 'Deployment', value: 'deployment' },
          { label: 'Tag', value: 'tags' },
        ],
      },
    }),
    lineItem: Property.ShortText({
      displayName: 'Line Item',
      description:
        'Only include this line item, for example streaming::nova-3.',
      required: false,
    }),
  },
  async run(context) {
    return getBillingBreakdown({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function getBillingBreakdown({
  apiKey,
  input,
}: {
  apiKey: string;
  input: BillingBreakdownInput;
}) {
  const start = deepgramReports.toDay(input.start);
  const end = deepgramReports.toDay(input.end);
  deepgramReports.checkRange({ start, end });
  const projectId = await deepgramProjects.resolveProjectId({
    apiKey,
    project: input.project,
  });
  const response = await deepgramClient.request<BillingBreakdownResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: deepgramProjects.projectPath({
      projectId,
      rest: ['billing', 'breakdown'],
    }),
    query: {
      start,
      end,
      grouping: input.groupBy ?? [],
      line_item: input.lineItem?.trim() || undefined,
    },
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'get the cost breakdown',
  });
  return deepgramReports.flattenBilling(response.body ?? {});
}

export type BillingBreakdownInput = {
  project?: string;
  start?: string;
  end?: string;
  groupBy?: string[];
  lineItem?: string;
};
