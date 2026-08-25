import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getMinimalSessionDates = createAction({
  auth: wedofAuth,
  name: 'getMinimalSessionsDates',
  displayName: 'Date minimale de début de session de formation',
  description:
    'Récupération des dates minimales de début de session de formation',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the earliest allowed training-session start dates for registration folders. Read-only, takes no input, and safe to call repeatedly. Use to determine the minimum valid start date before creating or scheduling a session.',
    idempotent: true,
  },
  props: {},

  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: wedofCommon.baseUrl + '/registrationFolders/utils/sessionMinDates',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
