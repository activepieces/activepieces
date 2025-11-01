import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { taskDropdown } from '../common/props';
import { meisterTaskApiService } from '../common/requests';

export const createAttachment = createAction({
  auth: meisterTaskAuth,
  name: 'createAttachment',
  displayName: 'Create Attachment',
  description: 'Creates a new attachment.',
  props: {
    taskId: taskDropdown({
      displayName: 'Select Task',
      description: 'Select a task',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'The name of the attachment',
      required: false,
    }),
    local: Property.File({
      displayName: 'File',
      description: 'The file to upload to a task',
      required: true,
    }),
  },
  async run(context) {
    const { taskId, name, local } = context.propsValue;

    const formData = new FormData();

    const blob = new Blob([local.base64], {
      type: local.extension
        ? `application/${local.extension}`
        : 'application/octet-stream',
    });

    formData.append('local', blob, local.filename || 'file');

    if (name) formData.append('name', name);

    return await meisterTaskApiService.createAttachment({
      auth: context.auth,
      taskId,
      payload: formData
    })
  },
});
