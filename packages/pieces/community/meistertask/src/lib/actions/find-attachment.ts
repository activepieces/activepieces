import { meistertaskAuth } from '../auth';
import { meisterTaskCommon, makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findAttachment = createAction({
  auth: meistertaskAuth,
  name: 'find_attachment',
  displayName: 'Find Attachment',
  description: 'Finds an attachment by searching',
  audience: 'both',
  aiMetadata: { description: 'Look up attachments on a specific MeisterTask task and return the first match. With a name supplied it returns the first attachment whose name contains that text (case-insensitive); leaving the name empty returns the first attachment on the task. Read-only and idempotent. Requires the task ID; returns null if no attachment matches.', idempotent: true },
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