import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCalculateItemsOutputSchema } from '../../../output-schemas';

const AGGREGATIONS = ['sum', 'average', 'count', 'minimum', 'maximum'];

export const calculateItemsAction = createAction({
  auth: podioAuth,
  name: 'podio_calculate_items',
  outputSchema: podioCalculateItemsOutputSchema,
  displayName: 'Calculate Items',
  description: 'Sums, averages, counts or finds the minimum or maximum over an app\'s items, optionally grouped.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Aggregates an app\'s items (sum, average, count, minimum or maximum) over a formula of number, money, duration, progress or calculation fields, optionally grouped by a field or a revision property and narrowed by filters. Every aggregation but count needs a formula. Field ids come from Get App; the app id from List Apps in Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps in Space or Get App.' }),
    aggregation: podioAiProps.choice({ required: true, displayName: 'Aggregation', description: 'How to aggregate the items.', values: AGGREGATIONS }),
    formula: podioAiProps.json({
      required: false,
      displayName: 'Formula',
      description: 'Alternating variables and operators, starting and ending with a variable, e.g. [{"type": "field", "value": 123}, {"type": "operator", "value": "multiply"}, {"type": "number", "value": 2}]. Operators: plus, minus, multiply, divide. Required unless Aggregation is "count".',
    }),
    groupings: podioAiProps.json({
      required: false,
      displayName: 'Groupings',
      description: 'e.g. [{"type": "field", "value": 456}] for an app, member, contact, date, state or question field, or [{"type": "revision", "value": "created_on", "sub_value": "month"}]; revision values: created_on, created_by, last_edit_on, last_edit_by, tags; date sub values: date, weekday, week, month, year.',
    }),
    filters: podioAiProps.json({
      required: false,
      displayName: 'Filters',
      description: 'A list of filters, e.g. [{"key": "created_on", "values": {"from": "2026-01-01", "to": "2026-06-30"}}, {"key": 789, "values": [1, 2]}].',
    }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of groups to return. Defaults to 15.' }),
  },
  async run({ auth, propsValue }) {
    if (!AGGREGATIONS.includes(propsValue.aggregation)) {
      throw new Error(`Aggregation must be one of: ${AGGREGATIONS.join(', ')}.`);
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/item/app/${propsValue.appId}/calculate`,
      body: podioUtils.body({
        values: {
          aggregation: propsValue.aggregation,
          formula: propsValue.formula,
          groupings: propsValue.groupings,
          filters: propsValue.filters,
          limit: propsValue.limit ?? undefined,
        },
      }),
    });
  },
});
