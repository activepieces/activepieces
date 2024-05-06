import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareRegistrationFolderTerminated = createAction({
  auth: wedofAuth,
  name: 'declareRegistrationFolderTerminated',
  displayName: "Passer un dossier de formation à l'état : sortie de formation",
  description:
    "Change l'état d'un dossier de formation vers : sortie de formation",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Sortie de formation le',
      description: 'Date au format YYYY-MM-DD.',
      required: false,
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
    absenceDuration: Property.Number({
      displayName: "durée d'absence",
      description:
        "La durée d'une éventuelle absence en heures. 0 si aucune absence.",
      required: false,
    }),
  },
  async run(context) {
    const message = {
      date: context.propsValue.date
        ? dayjs(context.propsValue.date).format('YYYY-MM-DD')
        : null,
      code: context.propsValue.code,
      absenceDuration: context.propsValue.absenceDuration,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/terminate',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
