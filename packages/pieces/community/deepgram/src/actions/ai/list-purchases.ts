import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { purchasesOutputSchema } from '../../output-schemas';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../../common/client';
import { deepgramProjects } from '../../common/projects';
import { deepgramProps } from '../../common/props';
import { deepgramReports, PurchaseRow } from '../../common/reports';

export const listPurchasesAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_purchases',
  classification: 'SEARCH',
  displayName: 'List Purchases',
  description: 'Lists the most recent credit purchases of a Deepgram project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the most recent credit purchases (orders) of a Deepgram project with amount, units, order type, creation and expiry date. Returns at most Limit orders and cannot page further. Use deepgram_list_balances for the credit that is left. Needs an admin or owner key. Read-only.',
    idempotent: true,
  },
  outputSchema: purchasesOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'How many recent purchases to return, from 1 to 1000. Defaults to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const raw = context.propsValue.limit;
    const limit =
      raw === undefined || raw === null || String(raw) === ''
        ? 10
        : Number(raw);
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error('Limit must be a whole number from 1 to 1000.');
    }
    const projectId = await deepgramProjects.resolveProjectId({
      apiKey,
      project: context.propsValue.project_id,
    });
    const response = await deepgramClient.request<PurchasesResponse>({
      apiKey,
      method: HttpMethod.GET,
      path: deepgramProjects.projectPath({ projectId, rest: ['purchases'] }),
      query: { limit },
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'list purchases',
    });
    const orders = (response.body?.orders ?? []).map((order) =>
      deepgramReports.flattenPurchase(order)
    );
    return { orders, count: orders.length };
  },
});

type PurchasesResponse = {
  orders?: PurchaseRow[];
};
