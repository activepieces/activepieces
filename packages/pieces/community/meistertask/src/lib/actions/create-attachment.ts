import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAttachment = createAction({
  auth: meistertaskAuth,
  name: 'create_attachment',
  displayName: 'Create Attachment',
  description: 'Creates a new attachment for a task',
  props: {
    project: meisterTaskCommon.project,
    section: meisterTaskCommon.section,
    task_id: meisterTaskCommon.task_id,
    name: Property.ShortText({
      displayName: 'Attachment Name',
      required: true,
    }),
    attachment_url: Property.ShortText({
      displayName: 'Attachment URL',
      required: true,
    }),
  },
  async run(context) {
    const token = getAccessToken(context.auth);
    const { task_id, name, attachment_url } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/attachments`,
      token,
      {
        name,
        attachment_url,
      }
    );

    return response.body;
  },
});
