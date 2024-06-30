import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const updateCompletionRate = createAction({
  auth: wedofAuth,
  name: 'updateCompletionRate',
  displayName: "Mettre à jour l'assiduité d'un apprenant",
  description:
    "Mettre à jour le taux d'avancement en % d'assiduité d'un apprenant pour un Dossier de formation donné.",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
    completionRate: Property.Number({
      displayName: "Taux d'avancement",
      description: "Taux d'avancement en % compris entre 0% et 100%. Uniquement sous format d'un entier. Uniquement possible à l'état En formation et Sortie de formation",
      required: true,
    }),
  },
  async run(context) {
    const message = {
        completionRate: context.propsValue.completionRate,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        body: message,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
