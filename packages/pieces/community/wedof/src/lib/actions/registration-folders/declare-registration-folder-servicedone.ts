import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const declareRegistrationFolderServicedone = createAction({
  auth: wedofAuth,
  name: 'declareRegistrationFolderServicedone',
  displayName: "Passer un dossier de formation à l'état : Service fait déclaré",
  description:
    "Change l'état d'un dossier de formation vers : Service fait déclaré",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
    absenceDuration: Property.Number({
      displayName: "durée d'absence",
      description:
        "La durée d'une éventuelle absence en heures. 0 si aucune absence.",
      required: false,
    }),
    forceMajeurAbsence: wedofCommon.forceMajeurAbsence,
    trainingDuration: Property.Number({
      displayName: 'Durée totale de la formation',
      description:
        "précise la durée totale de la formation afin de calculer le % d'absence",
      required: false,
    }),
    code: Property.ShortText({
      displayName: 'Code de sortie de formation',
      description:
        'Sélectionner la proprieté {code} du bloc Raisons de sortie de formation',
      required: false,
    }),
  },

  async run(context) {
    const message = {
      absenceDuration: context.propsValue.absenceDuration,
      forceMajeurAbsence: context.propsValue.forceMajeurAbsence,
      trainingDuration: context.propsValue.trainingDuration,
      code: context.propsValue.code,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/serviceDone',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
