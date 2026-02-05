import { meistertaskAuth } from '../../index';
import { meisterTaskCommon, makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findAttachment = createAction({
  auth: meistertaskAuth,
  name: 'find_attachment',
  displayName: 'Find Attachment',
  description: 'Finds an attachment by searching',
  props: {
    task_id: meisterTaskCommon.task_id,
    name: Property.ShortText({
      displayName: 'Attachment Name',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, name } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.GET,
      `/tasks/${task_id}/attachments`,
      token
    );

    let attachments = response.body;

    if (name) {
      attachments = attachments.filter((att: any) =>
        att.name.toLowerCase().includes(name.toLowerCase())
      );
    }

    return attachments.length > 0 ? attachments[0] : null;
  },
});