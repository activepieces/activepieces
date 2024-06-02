import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'getCertificationFolder',
  displayName: 'Récupérer un dossier de certification',
  description:
    ' Récupérer un dossier de certification à partir de son n° de dossier',
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
          context.propsValue.Id,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
