import { slidespeakAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { BASE_URL } from '../common/constants';

export const uploadDocumentAction = createAction({
  auth: slidespeakAuth,
  name: 'upload-docuemnt',
  displayName: 'Upload Document',
  description: 'Uploads a document file to SlideSpeak.',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
  },
  async run(context) {
    const { file } = context.propsValue;
    const apiKey = context.auth;

    const formData = new FormData();
    const fileBuffer = Buffer.from(file.base64, 'base64');
    formData.append('file', fileBuffer, file.filename);

    const response = await httpClient.sendRequest<{task_id:string}>({
      method: HttpMethod.POST,
      url: BASE_URL + '/document/upload',
      headers: {
        'X-API-key': apiKey,
        ...formData.getHeaders(),
      },
      body:formData
    });

    if(!response || !response.body.task_id){
      throw new Error('Failed to upload document.')
    }

    let status = 'FAILURE'
    const timeoutAt = Date.now() + 5 * 60 * 1000;
    const taskId = response.body.task_id

    do
    {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const pollRes = await httpClient.sendRequest<{task_id:string,task_status:string}>({
        method:HttpMethod.GET,
        url:BASE_URL + `/task_status/${taskId}`,
        headers: {
        'X-API-key': apiKey,
        }
      })

      status = pollRes.body.task_status

      if(status === 'SUCCESS') return pollRes.body;

    }while(status !== 'SUCCESS'&& Date.now() < timeoutAt )

    throw new Error('Upload document timed out or failed.');
  },
});
