import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../auth';
import { greipClient } from '../common/client';
import { greipProps } from '../common/props';
import { greipAsnOutputSchema } from '../output-schemas';

export const asnLookupAction = createAction({
  auth: greipAuth,
  name: 'asn_lookup',
  classification: 'READ',
  displayName: 'ASN Lookup',
  description: 'Look up details of an Autonomous System Number (ASN)',
  audience: 'human',
  outputSchema: greipAsnOutputSchema,
  props: {
    asn: Property.ShortText({
      displayName: 'AS Number',
      description: 'The AS Number to lookup (e.g., AS6167 or 6167)',
      required: true,
    }),
    format: greipProps.format({ required: false }),
    mode: greipProps.mode({ required: false }),
    callback: greipProps.callback({ required: false }),
  },
  async run(context) {
    const { asn, format, mode, callback } = context.propsValue;

    const queryParams: Record<string, string> = {};

    if (format) {
      queryParams['format'] = format;
    }

    if (mode) {
      queryParams['mode'] = mode;
    }

    if (callback) {
      queryParams['callback'] = callback;
    }

    return await greipClient.request({
      method: HttpMethod.GET,
      path: `/lookup/asn/${encodeURIComponent(asn)}`,
      query: queryParams,
      auth: context.auth,
    });
  },
});

