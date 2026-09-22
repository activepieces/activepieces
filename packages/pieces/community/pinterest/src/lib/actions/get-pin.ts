import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { getPinActionOutputSchema } from '../output-schemas';

export const getPin = createAction({
  auth: pinterestAuth,
  name: 'getPin',
  classification: 'READ',
  outputSchema: getPinActionOutputSchema,
  displayName: 'Get Pin',
  description: 'Read a single Pin by its id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Pin by id and returns its title, description, destination link, alt text, media and the board it lives on. Use it to inspect a Pin before updating or deleting it; use Search Pins or List Pins when only the text or board is known. Enable Include Metrics to add 90-day and lifetime counts, which Pinterest omits by default. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    pin_id: Property.ShortText({
      displayName: 'Pin ID',
      required: true,
      description: 'Numeric pin id, as returned by List Pins or Search Pins.',
    }),
    pin_metrics: Property.Checkbox({
      displayName: 'Include Metrics',
      required: false,
      defaultValue: false,
      description:
        'Return 90-day and lifetime metrics alongside the Pin. Total comments and reactions are lifetime-only.',
    }),
  },
  async run({ auth, propsValue }) {
    const { pin_id, pin_metrics } = propsValue;

    return await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath(`/pins/${pin_id}`, {
        pin_metrics: pin_metrics === true ? 'true' : undefined,
      })
    );
  },
});
