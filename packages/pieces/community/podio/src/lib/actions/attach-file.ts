import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { podioClient } from '../common/client';
import { podioProps } from '../common/props';
import { podioAuth } from '../auth';

export const attachFileAction = createAction({
  auth: podioAuth,
  name: 'attach_file',
  classification: 'WRITE',
  displayName: 'Attach File',
  description: 'Upload and attach a file to an item/task/comment.',
  audience: 'human',
  aiMetadata: { description: 'Attaches an already-uploaded Podio file to a target object — an item, task, status update, comment, or space — selected via the reference type and id. Use when linking an existing file to a Podio object; requires the file id, a space, and the target type/id. Not idempotent — each call adds another attachment.', idempotent: false },
  props: {
    orgId: podioProps.orgId({ required: true }),
    spaceId: podioProps.spaceId({ required: true }),
    appId: podioProps.appId({ required: true }),

    fileId: podioProps.fileId({ required: true }),
    
    refType: Property.Dropdown({
      auth: podioAuth,
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
    refId: podioProps.refId({ required: false }),

    silent: podioProps.silent({ required: false }),
  },
  async run(context) {
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

    const queryParams: QueryParams = {};
    if (typeof silent === 'boolean') {
      queryParams['silent'] = silent.toString();
    }

    return await podioClient.request<{
      file_id: number;
    }>({
      method: HttpMethod.POST,
      auth: context.auth,
      path: `/file/${fileId}/attach`,
      body,
      query: queryParams,
    });
  },
});
