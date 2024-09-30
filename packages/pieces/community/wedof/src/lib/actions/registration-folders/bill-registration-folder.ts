import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const billRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'billRegistrationFolder',
  displayName: 'Facturer le dossier de formation',
  description:
    'Associe le dossier de formation à un n° de facture et transmets les informations de facturation au financeur (EDOF par exemple)',
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
    billNumber: Property.ShortText({
      displayName: 'N° de facture',
      description: 'N° de la facture à associer',
      required: true,
    }),
    vatRate: Property.Number({
      displayName: 'TVA',
      description:
        'Permet de forcer un Taux de TVA en %. Par défaut la TVA est calculée à partir des données du dossier de formation',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      billNumber: context.propsValue.billNumber,
      vatRate: context.propsValue.vatRate,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/billing',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
