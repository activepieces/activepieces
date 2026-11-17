import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { insightlyMappers, outputSchemas } from '../../common/output-schemas';
import { aiProps, NOTE_PARENT_OPTIONS, YES_NO_OPTIONS } from '../../common/props';

export const aiAddNote = createAction({
  auth: insightlyAuth,
  name: 'ai_add_note',
  classification: 'WRITE',
  displayName: 'Add Note',
  description: 'Add a note to a record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a note (title + body) to an Insightly contact, lead, opportunity, organization or project. Not idempotent: each call adds another note.',
    idempotent: false,
  },
  outputSchema: outputSchemas['note'],
  props: {
    objectType: aiProps.objectType({ options: NOTE_PARENT_OPTIONS, description: 'Type of the record the note is attached to.' }),
    recordId: Property.Number({ displayName: 'Record ID', required: true }),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    body: Property.LongText({ displayName: 'Body', required: false }),
  },
  async run({ auth, propsValue }) {
    const objectName = insightlyCommon.ensureObject(propsValue.objectType);
    const recordId = insightlyUtils.toId({ value: propsValue.recordId, label: 'Record ID' });
    const connection = await insightlyCommon.connect({ auth });
    const note = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({ connection, method: HttpMethod.POST, path: `/${objectName}/${recordId}/Notes`, body: insightlyUtils.compact({ TITLE: propsValue.title, BODY: propsValue.body }) }),
    );
    return { noteId: insightlyUtils.readNumber(note['NOTE_ID']), title: insightlyUtils.readString(note['TITLE']) ?? propsValue.title, linkedObject: objectName, linkedId: recordId };
  },
});

export const aiCreateEvent = createAction({
  auth: insightlyAuth,
  name: 'ai_create_event',
  classification: 'WRITE',
  displayName: 'Create Event',
  description: 'Create a calendar event.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an Insightly calendar event with UTC start and end times. Not idempotent: each call creates another event.',
    idempotent: false,
  },
  outputSchema: outputSchemas['event'],
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    startUtc: Property.ShortText({ displayName: 'Start (UTC)', description: 'ISO 8601, e.g. 2026-12-01T15:00:00Z', required: true }),
    endUtc: Property.ShortText({ displayName: 'End (UTC)', description: 'ISO 8601, e.g. 2026-12-01T16:00:00Z', required: true }),
    allDay: Property.StaticDropdown<string, false>({ displayName: 'All Day', required: false, options: { options: YES_NO_OPTIONS } }),
    location: Property.ShortText({ displayName: 'Location', required: false }),
    details: Property.LongText({ displayName: 'Details', required: false }),
  },
  async run({ auth, propsValue }) {
    const connection = await insightlyCommon.connect({ auth });
    const event = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Events',
        body: insightlyUtils.compact({
          TITLE: propsValue.title,
          START_DATE_UTC: propsValue.startUtc,
          END_DATE_UTC: propsValue.endUtc,
          ALL_DAY: propsValue.allDay === 'yes',
          LOCATION: propsValue.location,
          DETAILS: propsValue.details,
        }),
      }),
    );
    return insightlyMappers.event(event);
  },
});
