import { createAction, Property } from '@activepieces/pieces-framework';
import { createServiceNowClient, servicenowAuth } from '../common/props';

export const deleteAttachmentAction = createAction({
  auth: servicenowAuth,
  name: 'delete_attachment',
  displayName: 'Delete Attachment',
  description: 'Delete an attachment by its sys_id',
  props: {
    attachment_sys_id: Property.ShortText({
      displayName: 'Attachment Sys ID',
      description:
        'The sys_id of the attachment to delete (use Find File to look it up)',
      required: true,
    }),
  },
  async run(context) {
    const { attachment_sys_id } = context.propsValue;
    const client = createServiceNowClient(context.auth);

    await client.deleteAttachment({ attachment_sys_id });

    return {
      success: true,
      attachment_sys_id,
    };
  },
});
