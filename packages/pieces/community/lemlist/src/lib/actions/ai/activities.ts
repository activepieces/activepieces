import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistApiCall } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { lemlistAuth } from '../../common/constants';
import { lemlistInput } from '../../common/input';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

export const listActivitiesAction = createAction({
  auth: lemlistAuth,
  name: 'list_activities',
  classification: 'SEARCH',
  displayName: 'List Activities',
  description: 'Lists campaign activities (emails sent, opened, replied, ...).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists lemlist activities (emails sent/opened/clicked/replied/bounced, LinkedIn steps, interest changes...), newest first. Filters: Type (exact activity type such as emailsReplied), Campaign ID, Lead ID, Min/Max Date (ISO 8601). Limit 1-100 (default 100) and Offset; has_more=true means call again with Offset + Limit. Read-only.',
    idempotent: true,
  },
  props: {
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Exact activity type, e.g. emailsReplied.',
      required: false,
    }),
    campaign_id: aiProps.campaignId(false),
    lead_id: Property.ShortText({ displayName: 'Lead ID', required: false }),
    min_date: Property.ShortText({ displayName: 'Min Date', description: 'ISO 8601 date-time.', required: false }),
    max_date: Property.ShortText({ displayName: 'Max Date', description: 'ISO 8601 date-time.', required: false }),
    limit: aiProps.limit({ max: 100, fallback: 100 }),
    offset: aiProps.offset(),
  },
  outputSchema: lemlistSchemas.activityPage,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
    const offset = lemlistInput.boundedInt({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000 }) ?? 0;
    const campaignId = lemlistInput.optionalText(propsValue.campaign_id);
    const leadId = lemlistInput.optionalText(propsValue.lead_id);
    const minDate = lemlistInput.optionalText(propsValue.min_date);
    const maxDate = lemlistInput.optionalText(propsValue.max_date);
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/activities',
      query: {
        version: 'v2',
        type: lemlistInput.optionalText(propsValue.type),
        campaignId:
          campaignId === undefined
            ? undefined
            : decodeURIComponent(lemlistInput.idSegment({ value: campaignId, label: 'Campaign ID', prefix: 'cam' })),
        leadId:
          leadId === undefined
            ? undefined
            : decodeURIComponent(lemlistInput.idSegment({ value: leadId, label: 'Lead ID', prefix: 'lea' })),
        minDate: minDate === undefined ? undefined : lemlistInput.isoDate({ value: minDate, label: 'Min Date' }),
        maxDate: maxDate === undefined ? undefined : lemlistInput.isoDate({ value: maxDate, label: 'Max Date' }),
        limit,
        offset,
      },
    });
    return lemlistResults.page({ items: lemlistResults.listFrom({ body }), offset, limit });
  },
});
