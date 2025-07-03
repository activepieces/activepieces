import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareCertificationFolderSuccess = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderSuccess',
  displayName: "Passer un dossier de certification à l'état : Réussi",
  description: "Change l'état d'un dossier de certification vers : Réussi",
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
    issueDate: Property.DateTime({
      displayName: "Date d'obtention de la certification",
      description: 'Date au format YYYY-MM-DD.',
      required: true,
    }),
    digitalProofLink: Property.ShortText({
      displayName:
        "Lien vers la preuve numérique de l'obtention de la certification",
      required: false,
    }),
    gradePass: wedofCommon.gradePass,
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      detailedResult: context.propsValue.detailedResult,
      issueDate: context.propsValue.issueDate
        ? dayjs(context.propsValue.issueDate).format('YYYY-MM-DD')
        : null,
      digitalProofLink: context.propsValue.digitalProofLink,
      europeanLanguageLevel: context.propsValue.europeanLanguageLevel,
      gradePass: context.propsValue.gradePass,
      comment: context.propsValue.comment,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/success',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
