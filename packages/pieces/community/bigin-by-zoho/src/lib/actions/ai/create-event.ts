import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../../auth';
import { biginAiProps } from '../../common/props';
import { getBiginConnection } from '../../common/request';
import { biginRecords } from '../../common/records';
import { biginOutputSchemas } from '../../common/output-schemas';
import { formatDateTime } from '../../common/helpers';

export const biginCreateEventAi = createAction({
  auth: biginAuth,
  name: 'bigin_create_event',
  classification: 'WRITE',
  displayName: 'Create Event (Agent)',
  description: 'Create a new event in Bigin.',
  audience: 'ai',
  outputSchema: biginOutputSchemas.aiCreateResult,
  aiMetadata: {
    description:
      'Creates a calendar event in Bigin, optionally linked to a contact, company or deal and with contact participants. Title, Start and End are required. Not idempotent: each call creates a new event. Returns the new id and the saved record.',
    idempotent: false,
  },
  props: {
    title: biginAiProps.text({ displayName: 'Title', description: 'Event title.', required: true }),
    start: biginAiProps.text({ displayName: 'Start', description: 'Start date and time (ISO 8601).', required: true }),
    end: biginAiProps.text({ displayName: 'End', description: 'End date and time (ISO 8601), after Start.', required: true }),
    allDay: Property.StaticDropdown({ displayName: 'All Day', description: 'Whether the event lasts all day.', required: false, options: { options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] } }),
    venue: biginAiProps.text({ displayName: 'Venue', description: 'Location of the event.', required: false }),
    relatedModule: biginAiProps.relatedModule(),
    relatedId: biginAiProps.relatedId(),
    participantIds: Property.Array({ displayName: 'Participant Contact IDs', description: 'Contact ids to invite.', required: false }),
    ownerId: biginAiProps.ownerId(),
    description: biginAiProps.longText({ displayName: 'Description', description: 'Event details.', required: false }),
    additionalFields: biginAiProps.additionalFields(),
  },
  async run(context) {
    const { propsValue } = context;
    if (Boolean(propsValue.relatedModule) !== Boolean(propsValue.relatedId)) {
      throw new Error('Related Module and Related Record ID must be set together.');
    }
    if (propsValue.start && propsValue.end && new Date(propsValue.end).getTime() <= new Date(propsValue.start).getTime()) {
      throw new Error('End must be after Start.');
    }
    const record = biginRecords.mergeAdditionalFields({
      record: {
      Event_Title: propsValue.title ?? undefined,
      Start_DateTime: propsValue.start ? formatDateTime(propsValue.start) : undefined,
      End_DateTime: propsValue.end ? formatDateTime(propsValue.end) : undefined,
      All_day: propsValue.allDay === undefined || propsValue.allDay === null ? undefined : propsValue.allDay === 'yes',
      Venue: propsValue.venue ?? undefined,
      Related_To: biginRecords.lookup(propsValue.relatedId ?? undefined),
      $related_module: propsValue.relatedId ? biginRecords.relatedModuleForApi(propsValue.relatedModule) : undefined,
      Participants: Array.isArray(propsValue.participantIds) && propsValue.participantIds.length > 0 ? propsValue.participantIds.map((id) => ({ type: 'contact', participant: String(id) })) : undefined,
      Owner: biginRecords.lookup(propsValue.ownerId ?? undefined),
      Description: propsValue.description ?? undefined,
      },
      additionalFields: propsValue.additionalFields,
    });
    return biginRecords.create({ connection: getBiginConnection(context.auth), module: 'Events', record });
  },
});
