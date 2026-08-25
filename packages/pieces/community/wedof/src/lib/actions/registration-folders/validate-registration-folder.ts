import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const validateRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'validateRegistrationFolder',
  displayName: 'Valider le dossier de formation',
  description: "Passer l'état du dossier de formation à l'état validé",
  audience: 'both',
  aiMetadata: {
    description:
      "Transitions a training registration folder into the 'validated' state, optionally supplying total training duration and weekly intensity. Not idempotent: it advances the folder's lifecycle and should be called once. The duration field is mandatory for France Travail (Pôle Emploi) funded folders.",
    idempotent: false,
  },
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
    indicativeDuration: Property.Number({
      displayName: 'Durée totale de la formation',
      description:
        "Obligatoire dans le cas d'un dossier de formation avec financement France Travail",
      required: false,
    }),
    weeklyDuration: Property.Number({
      displayName: 'Intensité hebdomadaire',
      description:
        'Intensité hebdomadaire de la formation, en heures par semaine',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      indicativeDuration: context.propsValue.indicativeDuration,
      weeklyDuration: context.propsValue.weeklyDuration,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/validate',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
