import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Note } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const createNoteAction = createAction({
  auth: zendeskSellAuth,
  name: 'create_note',
  displayName: 'Create Note',
  description: 'Add a note to a deal, lead, or contact',
  props: {
    content: Property.LongText({
      displayName: 'Note Content',
      description: 'Content of the note',
      required: true,
    }),
    resourceType: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Type of resource to attach note to',
      required: true,
      options: {
        options: [
          { label: 'Lead', value: 'lead' },
          { label: 'Contact', value: 'contact' },
          { label: 'Deal', value: 'deal' },
        ],
      },
    }),
    resourceId: Property.Number({
      displayName: 'Resource ID',
      description: 'ID of the lead, contact, or deal',
      required: true,
    }),
  },
  async run(context) {
    const noteData = {
      data: {
        content: context.propsValue.content,
        resource_type: context.propsValue.resourceType,
        resource_id: context.propsValue.resourceId,
      },
    };

    const response = await makeZendeskSellRequest<{ data: Note }>(
      context.auth,
      HttpMethod.POST,
      '/notes',
      noteData
    );

    return {
      success: true,
      note: response.data,
    };
  },
});
