import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
Follow these instructions to get your CometAPI Key:

1. Visit the CometAPI Dashboard: https://api.cometapi.com/console/token
2. Go to the API settings page to get your key
3. Copy the key and paste it below
`;

export const cometApiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
});
