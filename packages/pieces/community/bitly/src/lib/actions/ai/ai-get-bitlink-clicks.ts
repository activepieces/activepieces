import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlyAuth } from '../../common/auth';
import { clicksSummaryOutputSchema } from '../../common/schemas';
import { fetchClicksSummary } from '../get-bitlink-clicks';

export const aiGetBitlinkClicksAction = createAction({
  auth: bitlyAuth,
  name: 'ai_get_bitlink_clicks',
  classification: 'READ',
  displayName: 'Get Bitlink Clicks',
  description: 'Get the total clicks of a Bitlink over a time window.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns total_clicks for a Bitlink ID (e.g. bit.ly/abc123) over the last Number of Units of Unit (default: 30 days). -1 units means all available data; free Bitly plans only keep a short history. Read-only.',
    idempotent: true,
  },
  outputSchema: clicksSummaryOutputSchema,
  props: {
    bitlink_id: Property.ShortText({ displayName: 'Bitlink ID', description: 'For example bit.ly/abc123.', required: true }),
    unit: Property.StaticDropdown<string>({
      displayName: 'Unit',
      description: 'Defaults to day.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Minute', value: 'minute' },
          { label: 'Hour', value: 'hour' },
          { label: 'Day', value: 'day' },
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' },
        ],
      },
    }),
    units: Property.Number({ displayName: 'Number of Units', description: 'Defaults to 30; -1 for all data.', required: false }),
  },
  async run(context) {
    return fetchClicksSummary({
      auth: context.auth.props,
      bitlink: context.propsValue.bitlink_id,
      unit: context.propsValue.unit,
      units: context.propsValue.units,
    });
  },
});
