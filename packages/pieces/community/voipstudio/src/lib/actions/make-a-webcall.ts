import { createAction, Property } from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const makeAWebcall = createAction({
  auth: voipstudioAuth,
  name: 'makeAWebcall',
  displayName: 'Make a Webcall',
  description:
    'Make a webcall from e164 number to other e164 number or extension',
  audience: 'both',
  aiMetadata: {
    description:
      'Initiates a webcall that bridges a source number to a destination number or extension; both the source (E.164) and destination (E.164 or extension) are required. Use this to connect two parties by calling the source first, then the destination. Not idempotent: each call starts a new call.',
    idempotent: false,
  },
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'Source number in e164 format',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'Destination number in e164 format or extension',
      required: true,
    }),
  },
  async run(context) {
    const { from, to } = context.propsValue;

    const body = {
      from,
      to,
    };

    return await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/webcalls',
      body
    );
  },
});
