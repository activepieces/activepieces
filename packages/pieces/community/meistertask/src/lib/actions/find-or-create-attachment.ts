import { createAction, Property, DynamicPropsValue } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getAttachments, apiRequest } from '../api';
import { projectDropdown, taskDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

const getAttachmentFields = (): DynamicPropsValue => {
  return {
    name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Name of the attachment to find or create',
      required: true,
    }),
    source_url: Property.ShortText({
      displayName: 'File URL',
      description: 'URL of the file (required for creation)',
      required: true,
    }),
  };
};

export const findOrCreateAttachmentAction = createAction({
  auth: meisterTaskAuth,
  name: 'find_or_create_attachment',
  displayName: 'Find or Create Attachment',
  description: 'Finds an attachment by name or creates it if not found',
  props: {
    project_id: projectDropdown,
    task_id: taskDropdown,
    attachmentFields: Property.DynamicProperties({
      displayName: 'Attachment Details',
      description: 'Attachment information',
      required: true,
      refreshers: [],
      props: async () => getAttachmentFields(),
    }),
  },
  async run({ auth, propsValue }) {
    const { task_id, attachmentFields } = propsValue;
    
    if (!attachmentFields || typeof attachmentFields !== 'object') {
      throw new Error('Attachment fields are required');
    }

    const { name, source_url } = attachmentFields as any;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Attachment name is required and cannot be empty');
    }

    const attachments = await getAttachments(auth, task_id);
    const match = attachments.find((att: any) => 
      att.name && att.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (match) {
      return {
        success: true,
        found: true,
        data: match,
      };
    }

    if (!source_url || typeof source_url !== 'string' || source_url.trim().length === 0) {
      throw new Error('File URL is required to create attachment');
    }

    const body = {
      name: name.trim(),
      source_url: source_url.trim(),
    };

    const result = await apiRequest<any>(auth, HttpMethod.POST, `/tasks/${task_id}/attachments`, body);
    return {
      success: true,
      found: false,
      data: result,
    };
  },
});
