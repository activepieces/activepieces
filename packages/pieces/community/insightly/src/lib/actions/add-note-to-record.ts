import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, podProperty } from '../common/common';
import { insightlyDropdowns } from '../common/dropdowns';
import { outputSchemas } from '../common/output-schemas';
import { NOTE_PARENT_OPTIONS } from '../common/props';

export const addNoteToRecord = createAction({
  auth: insightlyAuth,
  name: 'add_note_to_record',
  classification: 'WRITE',
  displayName: 'Add Note to Record',
  description: 'Add a note to a contact, lead, opportunity, organization or project.',
  audience: 'human',
  outputSchema: outputSchemas['note'],
  props: {
    pod: podProperty(),
    objectName: Property.StaticDropdown({
      displayName: 'Record Type',
      required: true,
      options: { options: NOTE_PARENT_OPTIONS },
    }),
    recordId: insightlyDropdowns.recordDropdown({ displayName: 'Record', description: 'The record the note is added to' }),
    title: Property.ShortText({ displayName: 'Title', required: true }),
    body: Property.LongText({ displayName: 'Body', description: 'Note text. Basic HTML is allowed.', required: false }),
  },
  async run(context) {
    const objectName = insightlyCommon.ensureObject(context.propsValue.objectName);
    const recordId = insightlyUtils.toId({ value: context.propsValue.recordId, label: 'Record' });
    const connection = await insightlyCommon.connect({ auth: context.auth, pod: context.propsValue.pod });
    const note = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: `/${objectName}/${recordId}/Notes`,
        body: insightlyUtils.compact({ TITLE: context.propsValue.title, BODY: context.propsValue.body }),
      }),
    );
    return {
      noteId: insightlyUtils.readNumber(note['NOTE_ID']),
      title: insightlyUtils.readString(note['TITLE']) ?? context.propsValue.title,
      linkedObject: objectName,
      linkedId: recordId,
    };
  },
});
