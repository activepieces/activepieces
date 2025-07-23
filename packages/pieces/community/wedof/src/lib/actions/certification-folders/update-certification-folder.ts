import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const updateCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'updateCertificationFolder',
  displayName: 'Mettre à jour un dossier de certification',
  description:
    "Met à jour certaines informations modifiables d'un dossier de certification",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de certification',
      description:
        'Sélectionner la propriété {externalId} du dossier de certification',
      required: true,
    }),
    fieldsToUpdate: Property.StaticMultiSelectDropdown({
      displayName: 'Champs à mettre à jour',
      description: 'Sélectionner les champs que vous souhaitez mettre à jour',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: "Date d'inscription à la certification",
            value: 'enrollmentDate',
          },
          {
            label: "Date de début de l'examen",
            value: 'examinationDate',
          },
          {
            label: "Date de fin de l'examen",
            value: 'examinationEndDate',
          },
          {
            label: "Lieu de l'examen",
            value: 'examinationPlace',
          },
          {
            label: 'Tiers temps',
            value: 'tiersTemps',
          },
          {
            label: 'Commentaire',
            value: 'comment',
          },
          {
            label: 'Verbatim',
            value: 'verbatim',
          },
          {
            label: 'Prix du passage',
            value: 'amountHt',
          },
          {
            label: 'Tags',
            value: 'tags',
          },
        ],
      },
    }),
    dynamicFields: Property.DynamicProperties({
      displayName: 'Champs sélectionnés',
      refreshers: ['fieldsToUpdate'],
      required: false,
      props: async ({ fieldsToUpdate }) => {
        const fields: DynamicPropsValue = {};
        const selectedFields = (fieldsToUpdate as string[]) || [];

        if (selectedFields.includes('enrollmentDate')) {
          fields['enrollmentDate'] = Property.DateTime({
            displayName: "Date d'inscription à la certification",
            description: 'Date au format YYYY-MM-DD',
            required: false,
          });
        }

        if (selectedFields.includes('examinationDate')) {
          fields['examinationDate'] = Property.DateTime({
            displayName: "Date de début l'examen de certification",
            description: 'Date au format YYYY-MM-DD',
            required: false,
          });
        }

        if (selectedFields.includes('examinationEndDate')) {
          fields['examinationEndDate'] = Property.DateTime({
            displayName: "Date de fin l'examen de certification",
            description: 'Date au format YYYY-MM-DD',
            required: false,
          });
        }

        if (selectedFields.includes('examinationPlace')) {
          fields['examinationPlace'] = Property.ShortText({
            displayName: "Lieu de l'examen",
            description: "Lieu de l'examen de certification (ou lien https)",
            required: false,
          });
        }

        if (selectedFields.includes('tiersTemps')) {
          fields['tiersTemps'] = Property.StaticDropdown({
            displayName: 'Tiers temps',
            description: "Indique si le candidat a besoin d'un tiers temps",
            required: false,
            options: {
              disabled: false,
              options: [
                {
                  label: 'Non',
                  value: false,
                },
                {
                  label: 'Oui',
                  value: true,
                },
              ],
            },
          });
        }

        if (selectedFields.includes('comment')) {
          fields['comment'] = Property.LongText({
            displayName: 'Commentaire',
            description: "Commentaire (non-visible par l'apprenant)",
            required: false,
          });
        }

        if (selectedFields.includes('verbatim')) {
          fields['verbatim'] = Property.ShortText({
            displayName: 'Verbatim',
            description: 'Verbatim',
            required: false,
          });
        }

        if (selectedFields.includes('amountHt')) {
          fields['amountHt'] = Property.Number({
            displayName: 'Prix du passage de la certification',
            description: 'Tarif en €',
            required: false,
          });
        }

        if (selectedFields.includes('tags')) {
          fields['tags'] = Property.Array({
            displayName: 'Tags',
            description:
              'Liste de tags associée au dossier de certification, si vous souhaitez garder vos précédents tags, il faut les réécrire dans le champ',
            required: false,
          });
        }

        return fields;
      },
    }),
  },
  async run(context) {
    const { fieldsToUpdate, dynamicFields } = context.propsValue;
    const {
      enrollmentDate,
      examinationDate,
      examinationEndDate,
      examinationPlace,
      tiersTemps,
      comment,
      verbatim,
      amountHt,
      tags,
    } = dynamicFields || {};

    const message: Record<string, any> = {};
    const selectedFields = (fieldsToUpdate as string[]) || [];
    selectedFields.forEach((fieldName) => {
      switch (fieldName) {
        case 'enrollmentDate':
          message['enrollmentDate'] = enrollmentDate
            ? dayjs(enrollmentDate).format('YYYY-MM-DD')
            : null;
          break;
        case 'examinationDate':
          message['examinationDate'] = examinationDate || null;
          break;
        case 'examinationEndDate':
          message['examinationEndDate'] = examinationEndDate || null;
          break;
        case 'examinationPlace':
          message['examinationPlace'] = examinationPlace || null;
          break;
        case 'comment':
          message['comment'] = comment || null;
          break;
        case 'verbatim':
          message['verbatim'] = verbatim || null;
          break;
        case 'amountHt':
          message['amountHt'] = amountHt !== undefined ? amountHt : null;
          break;
        case 'tiersTemps':
          message['tiersTemps'] = tiersTemps !== undefined ? tiersTemps : null;
          break;
        case 'tags':
          message['tags'] = tags && tags.length > 0 ? (tags as string[]) : null;
          break;
      }
    });

    return (
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        body: message,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue['externalId'],
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
