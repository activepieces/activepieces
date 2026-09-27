import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';

export const assignLicense = createAction({
  auth: pushoverAuth,
  name: 'assign_license',
  classification: 'WRITE',
  displayName: 'Assign License',
  description: 'Spend a prepaid credit to license a Pushover user',
  audience: 'ai',
  aiMetadata: {
    description:
      'Assign a Pushover license to one user, identified by either their user key or their account email. This spends one prepaid credit, costs real money and cannot be revoked: there is no unassign endpoint. Check the balance with Get License Credits first and only call it when a human has explicitly asked for this person to be licensed. Not idempotent: a repeat call spends another credit.',
    idempotent: false,
  },
  props: {
    user: Property.ShortText({
      displayName: 'User Key',
      description:
        'The 30-character user key to license. Supply either this or Email, not both.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'Pushover account email of the person to license, used when their user key is unknown. Supply either this or User Key, not both.',
      required: false,
    }),
    os: Property.StaticDropdown({
      displayName: 'Operating System',
      description:
        'Restrict the license to one platform. Any platform may be used when omitted.',
      required: false,
      options: {
        options: [
          { label: 'Android', value: 'Android' },
          { label: 'iOS', value: 'iOS' },
          { label: 'Desktop', value: 'Desktop' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const hasUser = propsValue.user !== undefined && propsValue.user.length > 0;
    const hasEmail =
      propsValue.email !== undefined && propsValue.email.length > 0;
    if (hasUser === hasEmail) {
      throw new Error(
        'Assign License needs exactly one of User Key or Email to identify the recipient.'
      );
    }

    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: '/licenses/assign.json',
      body: {
        token: auth.props.api_token,
        ...(hasUser ? { user: propsValue.user } : {}),
        ...(hasEmail ? { email: propsValue.email } : {}),
        ...(propsValue.os ? { os: propsValue.os } : {}),
      },
    });
  },
});
