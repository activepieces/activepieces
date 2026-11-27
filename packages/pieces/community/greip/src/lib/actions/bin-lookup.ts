import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { greipAuth } from '../auth';
import { greipClient } from '../common/client';
import { greipProps } from '../common/props';
import { greipBinOutputSchema } from '../output-schemas';

export const binLookupAction = createAction({
  auth: greipAuth,
  name: 'bin_lookup',
  classification: 'READ',
  displayName: 'BIN Lookup',
  description: 'Look up details of a Bank Identification Number (BIN) or Issuer Identification Number (IIN)',
  audience: 'human',
  outputSchema: greipBinOutputSchema,
  props: {
    bin: Property.ShortText({
      displayName: 'BIN/IIN',
      description: 'The BIN/IIN of the card (minimum 6 digits). Can be partial like "456789" or full card number',
      required: true,
    }),
    format: greipProps.format({ required: false }),
    mode: greipProps.mode({ required: false }),
    userID: greipProps.userID({ required: false }),
    callback: greipProps.callback({ required: false }),
  },
  async run(context) {
    const { bin, format, mode, userID, callback } = context.propsValue;

    const queryParams: Record<string, string> = {};

    if (format) {
      queryParams['format'] = format;
    }

    if (mode) {
      queryParams['mode'] = mode;
    }

    if (userID) {
      queryParams['user_id'] = userID;
    }

    if (callback) {
      queryParams['callback'] = callback;
    }

    return await greipClient.request({
      method: HttpMethod.GET,
      path: `/lookup/bin/${encodeURIComponent(bin)}`,
      query: queryParams,
      auth: context.auth,
    });
  },
});

