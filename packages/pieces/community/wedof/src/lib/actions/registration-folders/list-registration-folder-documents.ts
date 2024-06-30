import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getRegistrationFolderDocuments = createAction({
  auth: wedofAuth,
  name: 'getRegistrationFolderDocuments',
  displayName: "Liste des documents d'un dossier de formation",
  description: "Récupérer la liste de documents d'un dossier de formation à partir de son n° de dossier",
  props: {
    Id: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {Id} du dossier de formation',
      required: true,
    }),
  },

  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.Id +'/files',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
