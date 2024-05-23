import { HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const listRegistrationFolders = createAction({
  auth: wedofAuth,
  name: 'listRegistrationFolders',
  displayName: 'Liste des dossiers de formations',
  description:
    ' Récupérer la liste des dossiers de formations',
  props: {
    page: Property.Number({
        displayName: 'Page',
        description:
          'Numéro de page de la requête - par défaut la première',
        required: false,
    }),
    limit: Property.Number({
        displayName: 'Limite',
        description:
          "Nombre d'éléments retourné par requête - par défaut 100",
        required: false,
        defaultValue:100,
    }),
  },

  async run(context) {
    const params = {
        limit: context.propsValue.limit ?? null,
        page: context.propsValue.page ?? null,
      };
    const queryParams: QueryParams = {};
    Object.keys(params).forEach((value) => {
      const key = value as keyof typeof params;
      if (params[key] != null && params[key] != undefined) {
        queryParams[value] = params[key] as unknown as string;
      }
    });
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        queryParams: queryParams,
        url: wedofCommon.baseUrl +'/registrationFolders',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});