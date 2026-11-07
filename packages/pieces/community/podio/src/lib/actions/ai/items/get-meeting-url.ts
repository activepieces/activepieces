import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetMeetingUrlOutputSchema } from '../../../output-schemas';

export const getMeetingUrlAction = createAction({
  auth: podioAuth,
  name: 'podio_get_meeting_url',
  outputSchema: podioGetMeetingUrlOutputSchema,
  displayName: 'Get Meeting URL',
  description: 'Gets the join URL of a meeting item; starts the meeting for its organizer.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Returns the URL to join the online meeting on a meeting item. When the connected user is the organizer, Podio also starts the meeting. The item id comes from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/meeting/url` });
  },
});
