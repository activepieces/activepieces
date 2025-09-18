import { PieceAuth } from '@activepieces/pieces-framework';

const authGuide = `
### To obtain your MagicSlides API credentials, follow these steps:

1. Login to your MagicSlides account
2. Navigate to your dashboard and go to the Settings
3. Copy your access ID and your email then paste it in the field below
`;

export const magicslidesAuth = PieceAuth.BasicAuth({
  description: authGuide,
  required: true,
  username: {
    displayName: 'Email',
    description: 'Your registered email address',
  },
  password: {
    displayName: 'Access ID',
    description: 'Your MagicSlides API access ID',
  },
  validate: async ({auth}) => {
    // There are no MagicSlides API for testing if the auth was valid
    if(auth && auth.password.length >= 8){
        return {
            valid: true,
        }
    }
    return {
        valid: false,
        error: 'Invalid Api Key'
    }
  }
});