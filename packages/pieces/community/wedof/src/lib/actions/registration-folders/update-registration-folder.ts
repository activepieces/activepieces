import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  Property,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const updateRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'updateRegistrationFolder',
  displayName: 'Mettre à jour un dossier de formation',
  description:
    "Met à jour certaines informations modifiables d'un dossier de formation",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
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
            label: 'Prix de la formation',
            value: 'price',
          },
          {
            label: 'Date de début de la session de formation',
            value: 'sessionStartDate',
          },
          {
            label: 'Date de fin de la session de formation',
            value: 'sessionEndDate',
          },
          {
            label: 'Notes privées',
            value: 'notes',
          },
          {
            label: 'Description publique',
            value: 'description',
          },
          {
            label: "Taux d'avancement",
            value: 'completionRate',
          },
          {
            label: 'Durée moyenne de la formation',
            value: 'indicativeDuration',
          },
          {
            label: 'Temps de formation par semaine',
            value: 'weeklyDuration',
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

        if (selectedFields.includes('price')) {
          fields['price'] = Property.Number({
            displayName: 'Prix de la formation',
            description: 'Nouveau tarif en €',
            required: false,
          });
        }

        if (selectedFields.includes('sessionStartDate')) {
          fields['sessionStartDate'] = Property.DateTime({
            displayName: 'Date de début de la session de formation',
            description: 'Date au format YYYY-MM-DD',
            required: false,
          });
        }

        if (selectedFields.includes('sessionEndDate')) {
          fields['sessionEndDate'] = Property.DateTime({
            displayName: 'Date de fin de la session de formation',
            description: 'Date au format YYYY-MM-DD',
            required: false,
          });
        }

        if (selectedFields.includes('notes')) {
          fields['notes'] = Property.LongText({
            displayName: 'Notes',
            description: "Notes privées (non-visible par l'apprenant)",
            required: false,
          });
        }

        if (selectedFields.includes('description')) {
          fields['description'] = Property.LongText({
            displayName: 'Description',
            description: "Note publique visible de l'apprenant",
            required: false,
          });
        }

        if (selectedFields.includes('completionRate')) {
          fields['completionRate'] = Property.Number({
            displayName: "Taux d'avancement",
            description:
              "Taux d'avancement en % compris entre 0% et 100%. Uniquement sous format d'un entier. Uniquement possible à l'état En formation et Sortie de formation",
            required: false,
          });
        }

        if (selectedFields.includes('indicativeDuration')) {
          fields['indicativeDuration'] = Property.Number({
            displayName: 'Durée moyenne de la formation',
            description: 'En heures, durée moyenne de la formation',
            required: false,
          });
        }

        if (selectedFields.includes('weeklyDuration')) {
          fields['weeklyDuration'] = Property.Number({
            displayName: 'Temps de formation par semaine',
            description: 'En heures, ne peut pas être supérieur à 99',
            required: false,
          });
        }

        if (selectedFields.includes('tags')) {
          fields['tags'] = Property.Array({
            displayName: 'Tags',
            description:
              'Liste de tags associée au dossier de formation, si vous souhaitez garder vos précédents tags, il faut les réécrire dans le champ',
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
      price,
      sessionStartDate,
      sessionEndDate,
      notes,
      description,
      completionRate,
      indicativeDuration,
      weeklyDuration,
      tags,
    } = dynamicFields || {};

    const message: Record<string, unknown> = {};
    const selectedFields = (fieldsToUpdate as string[]) || [];
    let priceChange: Record<string, unknown> | null = null;
    let trainingActionInfo: Record<string, unknown> | null = null;

    selectedFields.forEach((fieldName) => {
      switch (fieldName) {
        case 'price':
          if (!priceChange) priceChange = {};
          priceChange['price'] = price !== undefined ? price : null;
          break;
        case 'sessionStartDate':
          if (!trainingActionInfo) trainingActionInfo = {};
          trainingActionInfo['sessionStartDate'] = sessionStartDate
            ? dayjs(sessionStartDate).format('YYYY-MM-DD')
            : null;
          break;
        case 'sessionEndDate':
          if (!trainingActionInfo) trainingActionInfo = {};
          trainingActionInfo['sessionEndDate'] = sessionEndDate
            ? dayjs(sessionEndDate).format('YYYY-MM-DD')
            : null;
          break;
        case 'completionRate':
          if (!trainingActionInfo) trainingActionInfo = {};
          trainingActionInfo['completionRate'] =
            completionRate !== undefined ? completionRate : null;
          break;
        case 'indicativeDuration':
          if (!trainingActionInfo) trainingActionInfo = {};
          trainingActionInfo['indicativeDuration'] =
            indicativeDuration !== undefined ? indicativeDuration : null;
          break;
        case 'weeklyDuration':
          if (!trainingActionInfo) trainingActionInfo = {};
          trainingActionInfo['weeklyDuration'] =
            weeklyDuration !== undefined ? weeklyDuration : null;
          break;
        case 'notes':
          message['notes'] = notes || null;
          break;
        case 'description':
          message['description'] = description || null;
          break;
        case 'tags':
          message['tags'] = tags && tags.length > 0 ? (tags as string[]) : null;
          break;
      }
    });

    if (priceChange) {
      message['priceChange'] = priceChange;
    }
    if (trainingActionInfo) {
      message['trainingActionInfo'] = trainingActionInfo;
    }

    return (
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        body: message,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
