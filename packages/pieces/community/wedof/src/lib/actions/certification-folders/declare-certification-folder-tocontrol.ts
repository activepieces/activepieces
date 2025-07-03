import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareCertificationFolderToControl = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderToControl',
  displayName: "Passer un dossier de certification à l'état : À contrôler",
  description: "Change l'état d'un dossier de certification vers : À contrôler",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de certification',
      description:
        'Sélectionner la propriété {externalId} du dossier de certification',
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
      required: true,
    }),
    examinationEndDate: Property.DateTime({
      displayName: "Date de fin de passage de l'examen",
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
    examinationType: Property.StaticDropdown({
      displayName: "Type de passage de l'examen",
      required: true,
      defaultValue: {
        value: 'A_DISTANCE',
        label: 'À distance',
      },
      options: {
        options: [
          {
            value: 'A_DISTANCE',
            label: 'À distance',
          },
          {
            value: 'EN_PRESENTIEL',
            label: 'En présentiel',
          },
          {
            value: 'MIXTE',
            label: 'Mixte',
          },
        ],
        disabled: false,
      },
    }),
    examinationPlace: Property.ShortText({
      displayName: "Lieu de passage de l'examen",
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Commentaire',
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
          context.propsValue.externalId +
          '/control',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
