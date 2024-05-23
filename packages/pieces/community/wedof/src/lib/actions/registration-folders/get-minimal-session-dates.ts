import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../..';
import { createAction } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getMinimalSessionDates = createAction({
  auth: wedofAuth,
  name: 'getMinimalSessionsDates',
  displayName: 'Dates minimal de début de session de formation',
  description:
    ' Récupération des dates minimales de début de session de formation',
  props: {},

  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: wedofCommon.baseUrl + '/registrationFolders/utils/sessionMinDates',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
