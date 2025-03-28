import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const resetPartnership = createAction({
  auth: wedofAuth,
  name: 'resetPartnership',
  displayName: "Réinitialiser un partenariat",
  description: "Permet de réinitialiser les données du partenariat en état 'Demande en traitement'",

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
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
