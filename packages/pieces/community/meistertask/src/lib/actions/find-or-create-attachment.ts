import { meistertaskAuth, getAccessToken } from '../auth';
import { makeRequest, meisterTaskCommon } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateAttachment = createAction({
  auth: meistertaskAuth,
  name: 'find_or_create_attachment',
  displayName: 'Find or Create Attachment',
  description: 'Finds an attachment or creates one if it does not exist',
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

    const findResponse = await makeRequest(
      HttpMethod.GET,
      `/tasks/${task_id}/attachments`,
      token
    );

    const attachments = Array.isArray(findResponse.body) ? findResponse.body : [];
    const existing = attachments.find((att: any) =>
      att.name && att.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      return {
        found: true,
        created: false,
        attachment: existing,
      };
    }

    const createResponse = await makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/attachments`,
      token,
      {
        name,
        attachment_url,
      }
    );

    return {
      found: false,
      created: true,
      attachment: createResponse.body,
    };
  },
});
