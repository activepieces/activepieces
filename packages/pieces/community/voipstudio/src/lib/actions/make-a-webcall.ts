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
