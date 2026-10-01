import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { omieClient } from './common/client';

export const omieAuth = PieceAuth.CustomAuth({
  displayName: 'Omie Connection',
  description: `
  To get your Omie credentials:

  1. Log in to [Omie](https://app.omie.com.br) and open your app in the **Developer Portal** (Omie > Configurações > Desenvolvedores / [developer.omie.com.br](https://developer.omie.com.br)).
  2. Create an application (or open an existing one).
  3. Copy the **App Key** and **App Secret**.
  `,
  required: true,
  props: {
    app_key: Property.ShortText({
      displayName: 'App Key',
      description: 'The app key (app_key) of your Omie application.',
      required: true,
    }),
    app_secret: PieceAuth.SecretText({
      displayName: 'App Secret',
      description: 'The app secret (app_secret) of your Omie application.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await omieClient.call({
        auth: { props: { app_key: auth.app_key, app_secret: auth.app_secret } },
        module: 'geral/empresas',
        method: 'ListarEmpresas',
        param: { pagina: 1, registros_por_pagina: 1, apenas_importado_api: 'N' },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid App Key or App Secret.',
      };
    }
  },
});
