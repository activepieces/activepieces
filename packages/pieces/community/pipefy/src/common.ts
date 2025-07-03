import { OAuth2GrantType } from "@activepieces/shared";
import { PieceAuth, Property } from "@activepieces/pieces-framework";

export const auth = PieceAuth.OAuth2({
    authUrl: 'https://app.pipefy.com/oauth',
    tokenUrl: 'https://app.pipefy.com/oauth/token',
    required: true,
    scope: ['{scope}'],
    grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
    props: {
      scope: Property.ShortText({
        displayName: 'Scope',
        required: true,
        description: 'Pipefy Scope',
      }),
    },
  })