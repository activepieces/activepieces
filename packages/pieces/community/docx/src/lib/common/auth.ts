import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { DOCX_API_BASE } from './client';

const AUTH_DESCRIPTION = `
Il faut d'abord un compte (sans clé, aucun appel ne marche) :
1. Créez un compte GRATUIT sur https://dev.layerone.fr — 20 documents offerts/mois.
2. Générez une clé DocX dans l'onglet « Clés API ».
3. Collez-la ici.

Guide + collection Postman : https://dev.layerone.fr/integrations.html
`;

export const docxAuth = PieceAuth.SecretText({
  displayName: 'Clé API DocX',
  description: AUTH_DESCRIPTION,
  required: true,
  validate: async ({ auth }) => {
    // On poste un /render-document vide : l'API valide la clé
    // (check_quota_or_raise) AVANT tout traitement. Clé invalide -> 401/403 ;
    // clé valide -> 400 (aucun modèle fourni), sans consommer de quota.
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${DOCX_API_BASE}/render-document`,
        headers: { 'X-API-Key': auth as string },
      });
      // Toute réponse non-401/403 (y compris 400) = clé valide.
      void response;
      return { valid: true };
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response
        ?.status;
      if (status === 401 || status === 403) {
        return {
          valid: false,
          error:
            'Clé API invalide. Vérifiez votre clé DocX (X-API-Key) sur dev.layerone.fr.',
        };
      }
      // 400 (aucun modèle fourni) ou autre code non-auth = clé valide.
      return { valid: true };
    }
  },
});
