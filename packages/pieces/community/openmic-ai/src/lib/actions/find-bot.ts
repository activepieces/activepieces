import { createAction, Property } from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const findBot = createAction({
  auth: openmicAiAuth,
  name: 'findBot',
  displayName: 'Find Bot',
  description: 'Retrieve details of a specific bot by its UID',
  audience: 'both',
  aiMetadata: { description: 'Fetches the full details of a single OpenMic AI bot by its UID. Use when you already have a bot UID and need its configuration; to discover UIDs or browse bots, use Get Bots instead. Read-only and idempotent.', idempotent: true },
  props: {
    uid: Property.ShortText({
      displayName: 'Bot UID',
      description: 'The unique identifier of the bot',
      required: true,
    }),
  },
  async run(context) {
    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      `/bots/${context.propsValue.uid}`
    );

    return response.body;
  },
});
