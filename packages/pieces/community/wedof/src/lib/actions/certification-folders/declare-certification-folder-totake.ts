import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareCertificationFolderToTake = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderToTake',
  displayName: "Passer un dossier de certification à l'état : Prêt à passer",
  description: "Change l'état d'un dossier de certification vers: Prêt à passer",
  props: {
    Id: Property.ShortText({
      displayName: 'N° du dossier de certification',
      description:
        'Sélectionner la propriété {Id} du dossier de certification',
      required: true,
    }),
    enrollmentDate: Property.DateTime({
      displayName: "Date d'inscription à la certification",
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
    examinationDate: Property.DateTime({
      displayName: "Date de passage de l'examen",
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
    examinationEndDate: Property.DateTime({
      displayName: "Date de fin de passage de l'examen",
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
    examinationType: wedofCommon.examinationType,
    examinationPlace: Property.ShortText({
      displayName: "Lieu de passage de l'examen",
      required: false,
    }),
    comment: Property.LongText({
      displayName: "Commentaire",
      required: false,
    }),


  },
  async run(context) {
    const message = {
      enrollmentDate: context.propsValue.enrollmentDate
      ? dayjs(context.propsValue.enrollmentDate).format('YYYY-MM-DD')
      : null,
      examinationDate: context.propsValue.examinationDate
      ? dayjs(context.propsValue.examinationDate).format('YYYY-MM-DD')
      : null,
      examinationEndDate: context.propsValue.examinationEndDate
      ? dayjs(context.propsValue.examinationEndDate).format('YYYY-MM-DD')
      : null,
      examinationType: context.propsValue.examinationType,
      examinationPlace: context.propsValue.examinationPlace,
      comment: context.propsValue.comment,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.Id +
          '/take',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
