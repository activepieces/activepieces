import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { getWrikeApiUrl, taskIdProp, wrikeAuth } from '../common/common';
import { Property, createAction } from '@activepieces/pieces-framework';


export const uploadAttachmentAction = createAction({
  auth: wrikeAuth,
  name: 'upload_attachment',
  displayName: 'Upload Attachment to Task',
  description: 'Upload a file and attach it to a task',
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
  },
  async run(context) {
    const apiUrl = await getWrikeApiUrl(context.auth);
    const file = context.propsValue.file;

    const formData = new FormData();
    formData.append('X-File-Name', file.filename);
    // formData.append('file', file.data);

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${apiUrl}/tasks/${context.propsValue.taskId}/attachments`,
      body: formData,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return response.body.data[0];
  },
});
