import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getCertificationFolderDocuments = createAction({
  auth: wedofAuth,
  name: 'getCertificationFolderDocuments',
  displayName: "Liste des documents d'un dossier de certification",
  description: "Récupérer la list de documents d'un dossier de certification à partir de son n° de dossier",
  props: {
    Id: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {Id} du dossier de certification',
      required: true,
    }),
  },

  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.Id +'/documents',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
