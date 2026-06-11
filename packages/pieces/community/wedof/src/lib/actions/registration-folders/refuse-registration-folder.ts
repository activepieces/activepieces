import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const refuseRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'refuseRegistrationFolder',
  displayName: 'Refuser le dossier de formation',
  description: 'Refuser le dossier de formation',
  audience: 'both',
  aiMetadata: {
    description:
      "Refuses a training registration folder, recording a required refusal reason code and an optional explanatory note. Not idempotent: it advances the folder's lifecycle to a refused state and should be called once. Distinct from canceling a folder, which uses a separate action and reason set.",
    idempotent: false,
  },
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
    code: Property.Dropdown({
      auth: wedofAuth,
      displayName: 'Raison du refus du dossier de formation',
      description: 'Sélectionner la raison du refus',
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
              wedofCommon.baseUrl + '/registrationFoldersReasons?type=refused',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': auth.secret_text,
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
    description: Property.LongText({
      displayName: 'Description',
      description: ' Texte expliquant les raisons du refus',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      code: context.propsValue.code,
      description: context.propsValue.description,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/refuse',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
