import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioFile } from '../common/types';

export const attachFileAction = createAction({
  name: 'attach_file',
  displayName: 'Attach File',
  description: 'Attaches a file to an item, task, or other object in Podio.',
  auth: podioAuth,
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to attach',
      required: true,
    }),
    refType: Property.StaticDropdown({
      displayName: 'Reference Type',
      description: 'Type of object to attach the file to',
      required: true,
      options: {
        options: [
          { label: 'Item', value: 'item' },
          { label: 'Task', value: 'task' },
          { label: 'Status', value: 'status' },
          { label: 'Comment', value: 'comment' },
        ],
      },
    }),
    refId: Property.Number({
      displayName: 'Reference ID',
      description: 'ID of the object to attach the file to',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional description for the file',
      required: false,
    }),
  },
  async run(context) {
    const { file, refType, refId, description } = context.propsValue;

    if (!file || !refType || !refId) {
      throw new Error('File, reference type, and reference ID are required.');
    }

    // First, upload the file
    const formData = new FormData();
    formData.append('source', new Blob([file.data]), file.filename);
    if (description) {
      formData.append('description', description);
    }

    // https://developers.podio.com/doc/files/upload-file-1004361
    const uploadResponse = await podioApiCall<PodioFile>({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/file/v2/',
      body: formData,
    });

    // Then attach the file to the specified object
    const attachBody: any = {
      file_id: uploadResponse.file_id,
    };

    // https://developers.podio.com/doc/files/attach-file-22518
    const attachResponse = await podioApiCall<any>({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/file/${uploadResponse.file_id}/attach`,
      body: {
        ref_type: refType,
        ref_id: refId,
      },
    });

    return {
      file: uploadResponse,
      attachment: attachResponse,
    };
  },
});