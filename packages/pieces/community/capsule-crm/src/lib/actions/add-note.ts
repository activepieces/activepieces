import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';
import { capsuleProps } from '../common/props';

export const addNoteAction = createAction({
  auth: capsuleCrmAuth,
  name: 'add_note',
  displayName: 'Add Note to Entity',
  description: 'Add a note to a contact, opportunity, or project',
  
  props: {
    entityType: Property.StaticDropdown({
      displayName: 'Entity Type',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: 'party' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project', value: 'project' },
        ],
      },
    }),
    entityId: Property.ShortText({
      displayName: 'Entity ID',
      description: 'ID of the entity to add note to',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Note Content',
      required: true,
    }),
  },

  async run(context) {
    const { entityType, entityId, content } = context.propsValue;

    const note: any = {
      content,
      [entityType]: { id: entityId },
    };

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/notes',
      { note }
    );

    return response.note;
  },
});
