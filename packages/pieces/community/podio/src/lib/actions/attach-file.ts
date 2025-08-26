import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, silentProperty, dynamicRefTypeProperty, dynamicRefIdProperty, dynamicAppProperty, dynamicSpaceProperty, dynamicOrgProperty, dynamicFileProperty } from '../common';

export const attachFileAction = createAction({
  auth: podioAuth,
  name: 'attach_file',
  displayName: 'Attach File',
  description: 'Upload and attach a file to an item/task/comment.',
  props: {
    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
    appId: dynamicAppProperty,

    fileId: dynamicFileProperty,
    
    refType: Property.Dropdown({
      displayName: 'Attach To',
      description: 'What type of object to attach the file to',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Item', value: 'item' },
            { label: 'Task', value: 'task' },
            { label: 'Status Update', value: 'status' },
            { label: 'Comment', value: 'comment' },
            { label: 'Space', value: 'space' },
          ],
        };
      },
    }),
    refId: dynamicRefIdProperty,

    silent: silentProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { fileId, orgId, spaceId, appId, refType, refId, silent } = context.propsValue;

    if (!spaceId) {
      throw new Error('Space selection is required to load and attach files. Please select a space first.');
    }

    if (!fileId) {
      throw new Error('File selection is required. Please select a file from the dropdown.');
    }

    if (!refType) {
      throw new Error('Attach To selection is required. Please choose what type of object to attach the file to.');
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