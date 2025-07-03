import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getPartnership = createAction({
  auth: wedofAuth,
  name: 'getPartnership',
  displayName: "Récupération d'un partenariat",
  description:
    "Récupération d'un partenariat par le certifInfo de la certification et du siret du partenaire",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description:
        'Sélectionner le {certifInfo} de la certification considérée',
      required: true,
    }),
    siret: Property.ShortText({
        displayName: 'N° Siret',
        description:
          'Sélectionner le {siret} du partenaire',
        required: true,
      }),
  },
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:
          wedofCommon.baseUrl +
          '/certifications/' +
          context.propsValue.certifInfo + 
          '/partners/' + 
          context.propsValue.siret,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
