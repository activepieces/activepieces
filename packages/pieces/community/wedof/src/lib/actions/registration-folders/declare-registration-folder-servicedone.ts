import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareRegistrationFolderServicedone = createAction({
  auth: wedofAuth,
  name: 'declareRegistrationFolderServicedone',
  displayName: "Passer un dossier de formation à l'état : Service fait déclaré",
  description:
    "Passe le dossier dans l'état 'service fait déclaré' s'il est dans l'état 'sortie de formation' ou dans l'état 'en formation'. Si depuis l'état 'en formation', le passage à l'état intermédiaire 'sortie de formation' se fera automatiquement.",
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
      defaultValue: 0,
    }),
    forceMajeureAbsence: wedofCommon.forceMajeureAbsence,
    trainingDuration: Property.Number({
      displayName: 'Durée totale de la formation',
      description:
        "Précise la durée totale de la formation afin de calculer le % d'absence. Si rien n'est précisé, récupère la durée dans le trainingActionInfo/duration",
      required: false,
      defaultValue: 0,
    }),
    code: Property.Dropdown({
      displayName: 'Raison de la sortie de formation',
      description: 'Sélectionner la raison de sortie de formation',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        const response = (
          await httpClient.sendRequest({
            method: HttpMethod.GET,
            url:
              wedofCommon.baseUrl +
              '/registrationFoldersReasons?type=terminated',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': auth as string,
            },
          })
        ).body;
        const reasons = response.map(
          (reason: { label: string; code: string }) => {
            return { label: reason.label, value: reason.code };
          }
        );
        return {
          disabled: false,
          options: reasons,
        };
      },
    }),
    date: Property.DateTime({
      displayName: 'Sortie de formation le',
      description: "Date du sortie de formation au format YYYY-MM-DD. Par défaut, date du jour. Si la date a déjà été indiquée au moment du terminate, il n'est pas nécessaire de la repréciser",
      required: false,
      defaultValue: dayjs(new Date()).format('YYYY-MM-DD'),
    }),
  },

  async run(context) {
    const message = {
      absenceDuration: context.propsValue.absenceDuration ?? null,
      forceMajeureAbsence: context.propsValue.forceMajeureAbsence ?? null,
      trainingDuration: context.propsValue.trainingDuration ?? null,
      code: context.propsValue.code ?? null,
      date: context.propsValue.date ? dayjs(context.propsValue.date).format('YYYY-MM-DD') : null,
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
