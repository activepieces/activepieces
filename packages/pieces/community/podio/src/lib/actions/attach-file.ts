import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, silentProperty, dynamicRefTypeProperty, dynamicRefIdProperty, dynamicAppProperty, dynamicSpaceProperty } from '../common';

export const attachFileAction = createAction({
  auth: podioAuth,
  name: 'attach_file',
  displayName: 'Attach File',
  description: 'Attaches the uploaded file to the given object. Valid objects are "status", "item", "comment", "space", or "task".',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the uploaded file to attach',
      required: true,
    }),
    appId: dynamicAppProperty,
    spaceId: dynamicSpaceProperty,
    refType: Property.Dropdown({
      displayName: 'Reference Type',
      description: 'The type of object the file should be attached to',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Status', value: 'status' },
            { label: 'Item', value: 'item' },
            { label: 'Comment', value: 'comment' },
            { label: 'Space', value: 'space' },
            { label: 'Task', value: 'task' },
          ],
        };
      },
    }),
    refId: dynamicRefIdProperty,
    silent: silentProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { fileId, appId, spaceId, refType, refId, silent } = context.propsValue;

    if (!fileId || typeof fileId !== 'number') {
      throw new Error('File ID is required and must be a number.');
    }

    if (!refType) {
      throw new Error('Reference Type is required. Please select the type of object to attach the file to.');
    }

    if (!refId) {
      throw new Error('Reference Object is required. Please select the specific object to attach the file to.');
    }

    if (refType === 'item' && !appId) {
      throw new Error('App selection is required when attaching files to items. Please select an app first.');
    }

    if ((refType === 'status' || refType === 'task') && !spaceId) {
      throw new Error('Space selection is required when attaching files to status updates or tasks. Please select a space first.');
    }

    const body = {
      ref_type: refType,
      ref_id: refId,
    };

    const queryParams: any = {};
    if (typeof silent === 'boolean') {
      queryParams.silent = silent.toString();
    }

    const response = await podioApiCall<{
      file_id: number;
    }>({
      method: HttpMethod.POST,
      accessToken,
      resourceUri: `/file/${fileId}/attach`,
      body,
      queryParams,
    });

    return response;
  },
}); 