import { createAction, Property } from '@activepieces/pieces-framework';
import { tldvAuth } from '../..';
import { HttpMethod } from '@activepieces/pieces-common';
import { tldvCommon } from '../common/client';
import { meetingIdProperty } from '../common/props';

export const getMeeting = createAction({
  auth: tldvAuth,
  name: 'get_meeting',
  displayName: 'Get Meeting',
  description: 'Get meeting details by ID',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves the metadata for a single tl;dv meeting by its id, including name, date, duration, organizer, invitees, and the meeting URL. Use when you already have a meeting id and need its details. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    meetingId: meetingIdProperty,
  },
  async run(context) {
    const { meetingId } = context.propsValue;

    const response = await tldvCommon.apiCall<{
      id: string;
      name: string;
      happenedAt: string;
      url: string;
      duration: number;
      organizer: {
        name: string;
        email: string;
      };
      invitees: Array<{
        name: string;
        email: string;
      }>;
      template: string;
      extraProperties: Record<string, any>;
    }>({
      method: HttpMethod.GET,
      url: `/v1alpha1/meetings/${meetingId}`,
      auth: { apiKey: context.auth.secret_text },
    });

    return response;
  },
});

