import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';
import { validateUserKeyOutputSchema } from '../output-schemas';

export const validateUserKey = createAction({
  auth: pushoverAuth,
  name: 'validate_user_key',
  classification: 'READ',
  displayName: 'Validate User or Group Key',
  description: 'Check whether a Pushover user or group key is valid and reachable',
  audience: 'ai',
  aiMetadata: {
    description:
      'Check before sending whether a user or group key exists, is not disabled, and has at least one active device, returning its device names and licenses. Use it to validate a key handed to you by someone else; leave the key blank to check the key stored on the connection. Read-only despite being a POST: nothing is delivered and nothing changes. Safe to retry.',
    idempotent: true,
  },
  props: {
    user: Property.ShortText({
      displayName: 'User or Group Key',
      description:
        'The 30-character user or group key to validate. Defaults to the key stored on the connection when left blank.',
      required: false,
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description:
        'Optional device name to validate alongside the key, for example iphone.',
      required: false,
    }),
  },
  outputSchema: validateUserKeyOutputSchema,
  async run({ auth, propsValue }) {
    const suppliedUser = propsValue.user;
    const user =
      suppliedUser !== undefined && suppliedUser.length > 0
        ? suppliedUser
        : auth.props.user_key;

    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: '/users/validate.json',
      body: {
        token: auth.props.api_token,
        user,
        ...(propsValue.device ? { device: propsValue.device } : {}),
      },
    });
  },
});
