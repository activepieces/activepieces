import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { updateRegistrantStatusOutputSchema } from '../output-schemas';

export const zoomUpdateRegistrantStatus = createAction({
  auth: zoomAuth,
  name: 'zoom_update_registrant_status',
  displayName: 'Approve / Deny / Cancel Registrants',
  description: 'Approve, deny or cancel registrants of a meeting (paid Zoom plan).',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description: 'Approves, denies or cancels up to 30 registrants of a Zoom meeting, each given by registrant ID or email. Use after List Meeting Registrants for meetings with manual approval; Zoom allows at most 3 status changes per registrant per day. Sets a status, so repeating it is idempotent.',
    idempotent: true,
  },
  outputSchema: updateRegistrantStatusOutputSchema,
  props: {
    meeting_id: zoomProps.meetingId({ description: 'The numeric Zoom meeting ID, for example 85746065432.' }),
    action: Property.StaticDropdown({
      displayName: 'Action',
      description: 'What to do with the registrants.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Approve', value: 'approve' },
          { label: 'Deny', value: 'deny' },
          { label: 'Cancel', value: 'cancel' },
        ],
      },
    }),
    registrants: Property.Array({
      displayName: 'Registrants',
      description: 'Up to 30 registrants. Give each one a Registrant ID or an Email (or both).',
      required: true,
      properties: {
        id: Property.ShortText({ displayName: 'Registrant ID', required: false }),
        email: Property.ShortText({ displayName: 'Email', required: false }),
      },
    }),
    occurrence_id: zoomProps.occurrenceId(),
  },
  async run(context) {
    const meetingId = zoomClient.normalizeMeetingId(context.propsValue.meeting_id);
    const action = context.propsValue.action;
    if (action !== 'approve' && action !== 'deny' && action !== 'cancel') {
      throw new Error('Action must be approve, deny or cancel.');
    }
    const registrants = toRegistrants({ items: context.propsValue.registrants });
    await zoomClient.request({
      accessToken: context.auth.access_token,
      method: HttpMethod.PUT,
      path: `/meetings/${meetingId}/registrants/status`,
      query: { occurrence_id: zoomClient.optionalText(context.propsValue.occurrence_id) },
      body: { action, registrants },
      scope: 'meeting:update:registrant_status',
    });
    return { success: true, meeting_id: meetingId, action, registrants };
  },
});

function toRegistrants({ items }: { items: unknown }): { id?: string; email?: string }[] {
  const list = Array.isArray(items) ? items : [];
  const registrants = list.map((item) => {
    const record = zoomClient.isRecord(item) ? item : {};
    const id = zoomClient.optionalText(record['id']);
    const email = zoomClient.optionalText(record['email']);
    return { ...(id ? { id } : {}), ...(email ? { email } : {}) };
  });
  if (registrants.length === 0) {
    throw new Error('Add at least one registrant (Registrant ID or Email).');
  }
  if (registrants.length > 30) {
    throw new Error(`Zoom accepts at most 30 registrants per request; you gave ${registrants.length}. Split them into several steps.`);
  }
  const emptyIndex = registrants.findIndex((registrant) => registrant.id === undefined && registrant.email === undefined);
  if (emptyIndex !== -1) {
    throw new Error(`Registrant #${emptyIndex + 1} has neither a Registrant ID nor an Email.`);
  }
  return registrants;
}
