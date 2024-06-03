import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const abortCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'abortCertificationFolder',
  displayName: "Passer un dossier de certification à l’état : Abondonné",
  description:
    "Change l'état d'un dossier de certification vers : Abondonné",
    props: {
        Id: Property.ShortText({
          displayName: 'N° du dossier de certification',
          description:
            'Sélectionner la propriété {Id} du dossier de certification',
          required: true,
        }),
        comment: Property.LongText({
          displayName: "Commentaire",
          required: false,
        }),
    },

  async run(context) {
    const message = {
      comment: context.propsValue.comment,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.Id +
          '/abort',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
