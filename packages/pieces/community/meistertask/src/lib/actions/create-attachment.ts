import { meistertaskAuth } from '../../index';
import { meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAttachment = createAction({
  auth: meistertaskAuth,
  name: 'create_attachment',
  displayName: 'Create Attachment',
  description: 'Creates a new attachment',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'File Name',
      required: true,
    }),
    local: Property.ShortText({
      displayName: 'File URL',
      required: true,
    }),
  },
  
  async run(context) {
    const { task_id, name, local } = context.propsValue;
    
    return await meisterTaskCommon.makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/attachments`,
      context.auth.access_token,
      { name, local }
    );
  },
});
