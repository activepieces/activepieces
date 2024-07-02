import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const declareCertificationFolderFailed = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderFailed',
  displayName: 'Passer un dossier de certification à l’état : Échoué',
  description: "Change l'état d'un dossier de certification vers : Échoué",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de certification',
      description:
        'Sélectionner la propriété {externalId} du dossier de certification',
      required: true,
    }),
    detailedResult: Property.ShortText({
      displayName: "Détail du résultat de l'examen",
      required: false,
    }),
    europeanLanguageLevel: wedofCommon.europeanLanguageLevel,
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },

  async run(context) {
    const message = {
      detailedResult: context.propsValue.detailedResult,
      europeanLanguageLevel: context.propsValue.europeanLanguageLevel,
      comment: context.propsValue.comment,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/fail',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
