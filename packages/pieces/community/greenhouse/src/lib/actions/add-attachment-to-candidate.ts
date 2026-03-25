import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { makeRequest } from '../common/client';
import { candidateIdProp, userIdProp } from '../common/props';

type FileInput = {
  filename: string;
  base64?: string;
  data?: Buffer | string;
  extension?: string;
};

export const addAttachmentToCandidateAction = createAction({
  name: 'add_attachment_to_candidate',
  displayName: 'Add Attachment to Candidate',
  description: 'Add an attachment to a Greenhouse candidate or prospect.',
  auth: greenhouseAuth,
  props: {
    candidateId: candidateIdProp,
    userId: userIdProp,
    filename: Property.ShortText({
      displayName: 'Filename',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'Resume', value: 'resume' },
          { label: 'Cover Letter', value: 'cover_letter' },
          { label: 'Admin Only', value: 'admin_only' },
        ],
      },
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description: 'Optional MIME type. Defaults to application/octet-stream.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const file = propsValue.file as FileInput;
    const base64Content =
      file.base64 ??
      (typeof file.data === 'string'
        ? Buffer.from(file.data).toString('base64')
        : file.data
          ? Buffer.from(file.data).toString('base64')
          : '');

    return makeRequest(auth, {
      method: HttpMethod.POST,
      path: `/candidates/${propsValue.candidateId}/attachments`,
      onBehalfOfUserId: propsValue.userId,
      body: {
        filename: propsValue.filename || file.filename,
        type: propsValue.type,
        content: base64Content,
        content_type:
          propsValue.contentType ||
          (file.extension ? `application/${file.extension}` : 'application/octet-stream'),
      },
    });
  },
});
