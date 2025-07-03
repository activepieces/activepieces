import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gameballAuth } from '../..';

export const sendEvent = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'sendEvent',
  auth: gameballAuth,
  displayName: 'Send event',
  description: 'Send an event to gameball',
  props: {
    playerUniqueId: Property.ShortText({
      displayName: 'Your Player Unique Id',
      required: true,
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      required: true,
    }),
  },
  async run(context) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://api.gameball.co/api/v3.0/integrations/event',
      headers: {
        APIKey: context.auth, // Pass API key in headers
      },
      // update the event body with eventmetadata if requested in the future.
      body: {
        "playerUniqueId": context.propsValue.playerUniqueId,
        "events": {
          [context.propsValue.eventName]: {

          }
        }
      }
    });
    return res.body;
  },
});
