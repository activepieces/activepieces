import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const addNoteToChange = createAction({
  auth: freshserviceAuth,
  name: 'add_note_to_change',
  displayName: 'Add Note to Change',
  description: 'Adds a private or public note to an existing change request.',
  props: {
    change_id: freshserviceCommon.change(true),
    body: Property.LongText({
      displayName: 'Note Content',
      description: 'The content of the note. HTML is supported.',
      required: true,
    }),
    private: Property.Checkbox({
      displayName: 'Private Note',
      description: 'If checked, the note is only visible to agents. If unchecked, the requester can also see it.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const response = await freshserviceApiCall<{ note: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `changes/${context.propsValue.change_id}/notes`,
      auth: context.auth,
      body: {
        body: context.propsValue.body,
        private: context.propsValue.private ?? true,
      },
    });

    return response.body.note;
  },
});
