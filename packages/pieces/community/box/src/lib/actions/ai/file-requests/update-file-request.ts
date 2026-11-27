import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const STATUSES = ['active', 'inactive'];

export const updateFileRequestAction = createAction({
  auth: boxAuth,
  name: 'box_update_file_request',
  displayName: 'Update File Request',
  description: 'Changes the details of a Box file request, or turns it on or off.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a file request\'s title, description, status, required submitter fields or expiry; only the fields given change. Status "inactive" stops new uploads. Get the ID from Get File Request or Copy File Request.',
    idempotent: true,
  },
  props: {
    fileRequestId: boxAiProps.fileRequestId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title shown on the upload form.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description shown on the upload form.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"active" accepts uploads; "inactive" stops them and its URL returns 404.',
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
      description: 'When the request stops accepting uploads, ISO 8601; its status then turns "inactive".',
      required: false,
    }),
    etag: boxAiProps.etag({
      required: false,
      description: "The file request's last seen etag (from Get File Request). The update fails with 412 if it changed since.",
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.status !== undefined && !STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    const body = {
      ...(propsValue.title !== undefined ? { title: propsValue.title } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      ...(propsValue.status !== undefined ? { status: propsValue.status } : {}),
      ...(propsValue.isEmailRequired !== undefined ? { is_email_required: propsValue.isEmailRequired === 'true' } : {}),
      ...(propsValue.isDescriptionRequired !== undefined
        ? { is_description_required: propsValue.isDescriptionRequired === 'true' }
        : {}),
      ...(propsValue.expiresAt !== undefined ? { expires_at: propsValue.expiresAt } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/file_requests/${encodeURIComponent(propsValue.fileRequestId)}`,
      headers: propsValue.etag ? { 'if-match': propsValue.etag } : undefined,
      body,
    });
  },
});
