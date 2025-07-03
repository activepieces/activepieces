import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const clicksendAuth = PieceAuth.BasicAuth({
  required: true,
  username: Property.ShortText({
    displayName: 'Username',
    description: 'Your ClickSend API username',
    required: true,
  }),
  password: Property.ShortText({
    displayName: 'API Key',
    description: 'Your ClickSend API key',
    required: true,
  }),
});
