import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const createPartnership = createAction({
  auth: wedofAuth,
  name: 'createPartnership',
  displayName: "Créer un partenariat",
  description: "Permet de créer un nouveau partenariat avec le SIRET fourni",
  
  props: {
    certifInfo: Property.ShortText({
          displayName: 'N° certifInfo',
          description:
            'Sélectionner le {certifInfo} de la certification considérée', 
        required: true, 
        }),
    siret: Property.ShortText({
      displayName: 'N° siret',
      description: 'Le numéro SIRET du partenaire',
      required: true,
    }),
  },
  
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: wedofCommon.baseUrl + '/certifications/partners/' + context.propsValue.siret,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
        body:{
          'certifInfo': context.propsValue.certifInfo,
        }

      })
    ).body;
  },
});
