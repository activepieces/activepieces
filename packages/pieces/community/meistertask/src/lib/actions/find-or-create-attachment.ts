import { meistertaskAuth } from '../../index';
import { meisterTaskCommon, makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findOrCreateAttachment = createAction({
  auth: meistertaskAuth,
  name: 'find_or_create_attachment',
  displayName: 'Find or Create Attachment',
  description: 'Finds an attachment by searching, or creates one if it doesn\'t exist',
  props: {
    task_id: meisterTaskCommon.task_id,
    name: Property.ShortText({
      displayName: 'Attachment Name',
      required: true,
    }),
    file_url: Property.File({
      displayName: 'File URL',
      description: 'URL of the file to attach (used if creating)',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, name, file_url } = context.propsValue;

    // Try to find existing attachment
    const findResponse = await makeRequest(
      HttpMethod.GET,
      `/tasks/${task_id}/attachments`,
      token
    );

    const existingAttachment = findResponse.body.find((att: any) =>
      att.name.toLowerCase() === name.toLowerCase()
    );

    if (existingAttachment) {
      return {
        found: true,
        created: false,
        attachment: existingAttachment,
      };
    }

    // Create new attachment
    const createResponse = await makeRequest(
      HttpMethod.POST,
      `/tasks/${task_id}/attachments`,
      token,
      { url: file_url, name }
    );

    return {
      found: false,
      created: true,
      attachment: createResponse.body,
    };
  },
});