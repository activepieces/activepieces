import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const STATUSES = ['active', 'inactive'];

export const copyFileRequestAction = createAction({
  auth: boxAuth,
  name: 'box_copy_file_request',
  displayName: 'Copy File Request',
  description: 'Copies a Box file request onto another folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new file request that uploads into the given folder, copied from an existing one, and returns it with its ID and public URL; fields given override the copied ones. This is the only way to create a file request through the API: the first one is made in the Box web app.',
    idempotent: false,
  },
  props: {
    fileRequestId: boxAiProps.fileRequestId({
      required: true,
      description: "The file request to copy: the number in the web app's file request builder URL (https://*.app.box.com/filerequest/123), or from an earlier Copy File Request.",
    }),
    folderId: boxAiProps.folderId({
      required: true,
      description: 'ID of the folder the new file request uploads into. Get it from List Folder Items, Search or Create Folder.',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title for the new request. Defaults to the copied one.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description for the new request. Defaults to the copied one.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"active" accepts uploads; "inactive" does not. Defaults to the copied one.',
      required: false,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    isEmailRequired: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Email Required',
      description: '"true" or "false": whether submitters must give their email address.',
    }),
    isDescriptionRequired: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Description Required',
      description: '"true" or "false": whether submitters must describe their files.',
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expires At',
      description: 'When the new request stops accepting uploads, ISO 8601.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.status !== undefined && !STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/file_requests/${encodeURIComponent(propsValue.fileRequestId)}/copy`,
      body: {
        folder: { type: 'folder', id: propsValue.folderId },
        ...(propsValue.title !== undefined ? { title: propsValue.title } : {}),
        ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
        ...(propsValue.status !== undefined ? { status: propsValue.status } : {}),
        ...(propsValue.isEmailRequired !== undefined ? { is_email_required: propsValue.isEmailRequired === 'true' } : {}),
        ...(propsValue.isDescriptionRequired !== undefined
          ? { is_description_required: propsValue.isDescriptionRequired === 'true' }
          : {}),
        ...(propsValue.expiresAt !== undefined ? { expires_at: propsValue.expiresAt } : {}),
      },
    });
  },
});
