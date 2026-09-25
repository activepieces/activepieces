import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { fetchProjectsDocument } from './api';
import {
  COMMERCIAL_SITES,
  EA_LOBBY,
  EA_SITE,
  PRODUCTION_LOBBY,
  assertAuthProps,
  readAuth,
} from './auth-props';
import { toSafeMessage } from './errors';

export const aconexAuth = PieceAuth.CustomAuth({
  description: [
    'Register a User-Bound OAuth client in the Oracle Construction and Engineering Lobby.',
    'The client is bound to one Lobby user. If that user links to more than one Aconex account,',
    'set Aconex user id and instance. Leave both empty when there is only one linked account.',
    'Use the Early Access Lobby only with an EA1 client.',
  ].join(' '),
  required: true,
  props: {
    lobby: Property.StaticDropdown({
      displayName: 'Lobby',
      description: 'Commercial production or Early Access. There is no free-text host.',
      required: true,
      defaultValue: PRODUCTION_LOBBY,
      options: {
        options: [
          { label: 'Commercial production', value: PRODUCTION_LOBBY },
          { label: 'Early Access', value: EA_LOBBY },
        ],
      },
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Client id of the User-Bound OAuth client registered in the Lobby.',
      required: true,
    }),
    clientSecret: PieceAuth.SecretText({
      displayName: 'Client secret',
      description: 'Client secret of the User-Bound OAuth client. Stored as a secret.',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'Aconex user id',
      description:
        'Digits only. Set this and the instance when the Lobby user links to more than one Aconex account. Leave both empty when there is only one linked account.',
      required: false,
    }),
    userSite: Property.StaticDropdown({
      displayName: 'Aconex instance',
      description:
        'user_site origin. Required together with the user id. https://ea1.aconex.com is valid only with the Early Access Lobby.',
      required: false,
      options: {
        options: [
          { label: 'One linked account (omit instance)', value: '' },
          ...COMMERCIAL_SITES.map((site) => ({ label: site, value: site })),
          { label: `${EA_SITE} (Early Access only)`, value: EA_SITE },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      await fetchProjectsDocument(assertAuthProps(readAuth(auth)));
      return { valid: true };
    } catch (error) {
      return { valid: false, error: toSafeMessage(error) };
    }
  },
});
