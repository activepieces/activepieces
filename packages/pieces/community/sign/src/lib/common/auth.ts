import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { SIGN_API_BASE } from './client';

const AUTH_DESCRIPTION = `
Il faut d'abord un compte (sans clé, aucun appel ne marche) :
1. Créez un compte GRATUIT sur https://dev.layerone.fr — 10 signatures offertes/mois.
2. Générez une clé Sign dans l'onglet « Clés API ».
3. Collez-la ici.

Guide + collection Postman : https://dev.layerone.fr/integrations.html
`;

export const signAuth = PieceAuth.SecretText({
  displayName: 'Clé API Sign',
  description: AUTH_DESCRIPTION,
  required: true,
  validate: async ({ auth }) => {
    // On interroge un document fictif : 401/403 = clé invalide.
    // Tout autre code (404 « document introuvable »…) = clé valide.
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${SIGN_API_BASE}/v1/documents/activepieces-auth-check`,
        headers: { 'X-API-Key': auth as string },
      });
      return { valid: true };
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error:
            'Clé API invalide. Vérifiez votre clé Sign (X-API-Key) dans dev.layerone.fr.',
        };
      }
      // 404 (document introuvable) ou autre code non-auth = clé valide.
      return { valid: true };
    }
  },
});
