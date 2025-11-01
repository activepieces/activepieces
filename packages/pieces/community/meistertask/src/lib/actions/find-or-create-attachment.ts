import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskApiService } from '../common/requests';
import { taskDropdown } from '../common/props';

export const findOrCreateAttachment = createAction({
  auth: meisterTaskAuth,
  name: 'findOrCreateAttachment',
  displayName: 'Find or Create Attachment',
  description:
    'Finds an attachment by searching, or creates one if it doesn’t exist.',
  props: {
    taskId: taskDropdown({
      displayName: 'Select Task',
      description: 'Select a task',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'The name of the attachment to search for',
      required: true,
    }),
    local: Property.File({
      displayName: 'File',
      description: 'The file to upload to a task',
      required: true,
    }),
  },
  async run(context) {
    const { taskId, name, local } = context.propsValue;

    const response = await meisterTaskApiService.fetchAttachments({
      auth: context.auth,
      taskId,
    });

    const matchingItems = response.filter(
      (item: any) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (matchingItems.length > 0) {
      return {
        found: true,
        data: matchingItems,
        message:
          matchingItems.length === 1
            ? 'Found 1 matching attachment'
            : `Found ${matchingItems.length} matching attachments`,
      };
    }

    const formData = new FormData();

    const blob = new Blob([local.base64], {
      type: local.extension
        ? `application/${local.extension}`
        : 'application/octet-stream',
    });

    formData.append('local', blob, local.filename || 'file');
    formData.append('name', name);

    const resp = await meisterTaskApiService.createAttachment({
      auth: context.auth,
      taskId,
      payload: formData,
    });

    return {
      found: false,
      data: resp,
      message: 'Found 0 matching attachments. Created New Attachment',
    };
  },
});
