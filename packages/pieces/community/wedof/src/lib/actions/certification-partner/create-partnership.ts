import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const createPartnership = createAction({
  auth: wedofAuth,
  name: 'createPartnership',
  displayName: "Créer un partenariat",
  description: "Permet de créer un nouveau partenariat avec le SIRET fourni",
  audience: 'both',
  aiMetadata: {
    description:
      "Create a new partnership between a Wedof certification and a training organization identified by its SIRET. Pick this to request/establish a partner relationship; use update-partnership to modify an existing one. Requires the certification's certifInfo and the partner's SIRET, and is not idempotent.",
    idempotent: false,
  },

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
          'X-Api-Key': context.auth.secret_text,
        },
        body:{
          'certifInfo': context.propsValue.certifInfo,
        }

      })
    ).body;
  },
});
