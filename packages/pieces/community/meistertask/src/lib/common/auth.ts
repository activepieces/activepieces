import { PieceAuth } from '@activepieces/pieces-framework';
import { meisterTaskApiService } from './requests';

export const meisterTaskAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
  required: true,
  async validate(context) {
    try {
      await meisterTaskApiService.fetchMe({
        auth: context.auth,
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not validate credentials. please check your credentials are correct.',
      };
    }
  },
});
