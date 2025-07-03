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
    "Met à jour certaines informations modifiables d'un dossier de formation",
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
      displayName: 'Date de début de la session de formation',
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
      description: "Notes privées (non-visible par l'apprenant)",
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: "Note publique visible de l'apprenant",
      required: false,
    }),
    completionRate: Property.Number({
      displayName: "Taux d'avancement",
      description: "Taux d'avancement en % compris entre 0% et 100%. Uniquement sous format d'un entier. Uniquement possible à l'état En formation et Sortie de formation",
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
    tags: Property.Array({
      displayName: "Tags",
      description: "Liste de tags associée au dossier de formation, si vous souhaitez garder vos précédents tags, il faut les réécrire dans le champ",
      required: false,
    }),
  },
  async run(context) {
    const message = {
      notes: context.propsValue.notes ?? null,
      description: context.propsValue.description ?? null,
      priceChange: {
        price: context.propsValue.price ?? null,
      },
      trainingActionInfo: {
        sessionStartDate: context.propsValue.sessionStartDate
          ? dayjs(context.propsValue.sessionStartDate).format('YYYY-MM-DD')
          : null,
        sessionEndDate: context.propsValue.sessionEndDate
          ? dayjs(context.propsValue.sessionEndDate).format('YYYY-MM-DD')
          : null,
        completionRate: context.propsValue.completionRate ?? null,
        indicativeDuration: context.propsValue.indicativeDuration ?? null,
        weeklyDuration: context.propsValue.weeklyDuration ?? null,
      },
      tags: context.propsValue.tags as string[],
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
