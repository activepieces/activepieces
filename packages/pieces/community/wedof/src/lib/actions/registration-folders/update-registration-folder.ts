import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const updateRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'updateRegistrationFolder',
  displayName: 'Mettre à jour un dossier de formation',
  description:
    "Met à jour certaines informations modifiable d'un dossier de formation",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Prix de la formation',
      description: 'Nouveau tarif en €',
      required: false,
    }),
    sessionStartDate: Property.DateTime({
      displayName: 'Date de debut de la session de formation',
      description: 'Date au format YYYY-MM-DD',
      required: false,
    }),
    sessionEndDate: Property.DateTime({
      displayName: 'Date de fin de la session de formation',
      description: 'Date au format YYYY-MM-DD',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: "notes privées (non visible par l'apprenant)",
      required: false,
    }),
    indicativeDuration: Property.Number({
      displayName: 'Durée moyenne de la formation',
      description: 'En heures, durée moyenne de la formation',
      required: false,
    }),
    weeklyDuration: Property.Number({
      displayName: 'Temps de formation par semaine',
      description: 'En heures, ne peut pas être supérieur à 99',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      notes: context.propsValue.notes,
      priceChange: {
        price: context.propsValue.price,
      },
      trainingActionInfo: {
        sessionStartDate: context.propsValue.sessionStartDate
          ? dayjs(context.propsValue.sessionStartDate).format('YYYY-MM-DD')
          : null,
        sessionEndDate: context.propsValue.sessionEndDate
          ? dayjs(context.propsValue.sessionEndDate).format('YYYY-MM-DD')
          : null,
        indicativeDuration: context.propsValue.indicativeDuration,
        weeklyDuration: context.propsValue.weeklyDuration,
      },
    };
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
