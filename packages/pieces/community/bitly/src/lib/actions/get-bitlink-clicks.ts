import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { bitlinkPath, bitlyApiCall, BitlyAuthProps, normalizeBitlinkId } from '../common/client';
import { bitlyAuth } from '../common/auth';
import { bitlinkDropdown, groupGuid } from '../common/props';
import { clicksSummaryOutputSchema } from '../common/schemas';

export const getBitlinkClicksAction = createAction({
  auth: bitlyAuth,
  name: 'get_bitlink_clicks',
  classification: 'READ',
  displayName: 'Get Bitlink Clicks',
  description: 'Get the total number of clicks on a Bitlink over a time window.',
  audience: 'human',
  aiMetadata: { description: 'Returns the total click count of a Bitlink for the last N units (day, week, month, hour or minute). Read-only.', idempotent: true },
  outputSchema: clicksSummaryOutputSchema,
  props: {
    group_guid: groupGuid,
    bitlink: bitlinkDropdown,
    unit: Property.StaticDropdown<string>({
      displayName: 'Unit',
      description: 'Time unit for the window. Defaults to day.',
      required: false,
      defaultValue: 'day',
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
    units: Property.Number({
      displayName: 'Number of Units',
      description: 'How many units back to count. -1 means all available data. Defaults to 30.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    return fetchClicksSummary({
      auth: context.auth.props,
      bitlink: context.propsValue.bitlink,
      unit: context.propsValue.unit,
      units: context.propsValue.units,
    });
  },
});

export async function fetchClicksSummary({
  auth,
  bitlink,
  unit,
  units,
}: {
  auth: BitlyAuthProps;
  bitlink: unknown;
  unit: unknown;
  units: unknown;
}): Promise<ClicksSummary> {
  const id = normalizeBitlinkId(bitlink);
  const resolvedUnit = unit === undefined || unit === null || unit === '' ? 'day' : String(unit);
  if (!CLICK_UNITS.includes(resolvedUnit)) {
    throw new Error(`Unit must be one of ${CLICK_UNITS.join(', ')}.`);
  }
  const resolvedUnits = units === undefined || units === null || units === '' ? 30 : Number(units);
  if (!Number.isInteger(resolvedUnits) || (resolvedUnits < 1 && resolvedUnits !== -1)) {
    throw new Error('Number of Units must be a whole number of at least 1, or -1 for all data.');
  }
  return bitlyApiCall<ClicksSummary>({
    method: HttpMethod.GET,
    auth,
    resourceUri: `/bitlinks/${bitlinkPath(id)}/clicks/summary`,
    query: { unit: resolvedUnit, units: resolvedUnits },
    operation: 'get Bitlink clicks',
  });
}

const CLICK_UNITS = ['minute', 'hour', 'day', 'week', 'month'];

export type ClicksSummary = {
  total_clicks: number;
  unit: string;
  units: number;
  unit_reference?: string;
};
