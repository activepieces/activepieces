import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { getAttachments } from '../api';
import { projectDropdown, taskDropdown } from '../common/props';

export const findAttachmentAction = createAction({
  auth: meisterTaskAuth,
  name: 'find_attachment',
  displayName: 'Find Attachment',
  description: 'Finds attachments in a task',
  props: {
    project_id: projectDropdown,
    task_id: taskDropdown,
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Name of the attachment to search for (leave empty to get all attachments)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { task_id, filename } = propsValue;
    
    const attachments = await getAttachments(auth, task_id);
    
    if (filename && typeof filename === 'string' && filename.trim().length > 0) {
      const filteredAttachments = attachments.filter((att: any) => 
        att.name && att.name.toLowerCase().includes(filename.trim().toLowerCase())
      );
      return {
        success: true,
        attachments: filteredAttachments,
        count: filteredAttachments.length,
      };
    }
    
    return {
      success: true,
      attachments,
      count: attachments.length,
    };
  },
});
