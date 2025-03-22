import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const deletePartnership = createAction({
  auth: wedofAuth,
  name: 'deletePartnership',
  displayName: "Supprimer un partenariat",
  description: "Supprime un partenariat à l'état Demande à compléter",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description: 'Sélectionner le {certifInfo} de la certification considérée',
      required: true,
    }),
    siret: Property.ShortText({
      displayName: 'N° Siret',
      description: 'Sélectionner le {siret} du partenaire',
      required: true,
    }),
  },
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
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
