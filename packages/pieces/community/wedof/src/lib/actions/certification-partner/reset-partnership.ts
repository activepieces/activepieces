import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const resetPartnership = createAction({
  auth: wedofAuth,
  name: 'resetPartnership',
  displayName: "Réinitialiser un partenariat",
  description: "Permet de réinitialiser les données du partenariat en état 'Demande en traitement'",
  audience: 'both',
  aiMetadata: {
    description:
      "Reset an existing certification partnership (identified by certification certifInfo and partner SIRET) back to the 'request being processed' state. This mutates the partnership's status, so do not use it merely to read the record (use the get action) or to remove it (use the delete action).",
    idempotent: false,
  },

  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description: 'Identifiant de la certification',
      required: true,
    }),
    siret: Property.ShortText({
      displayName: 'N° siret',
      description: 'Numéro SIRET du partenaire à réinitialiser',
      required: true,
    }),
  },
  
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: wedofCommon.baseUrl + '/certifications/'+ context.propsValue.certifInfo +'/partners/'+ context.propsValue.siret +'/reinitialize',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
