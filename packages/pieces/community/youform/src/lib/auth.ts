import {
  AppConnectionType,
  PieceAuth,
  tryCatch,
} from '@activepieces/pieces-framework';

import { youformApi } from './common/api';

export const youformAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `You can obtain API token from [Account Settings](https://app.youform.com/account).`,
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      youformApi.getMe({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
      })
    );
    return error
      ? {
          valid: false,
          error: 'Invalid API Token',
        }
      : {
          valid: true,
        };
  },
  getConnectionIdentifier: async ({ auth }) => {
    const { data } = await tryCatch(() =>
      youformApi.getMe({
        auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
      })
    );
    return data?.data.email;
  },
});
