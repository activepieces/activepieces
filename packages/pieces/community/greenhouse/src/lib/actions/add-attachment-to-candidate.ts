import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { compactObject, makeRequest } from '../common';
import { candidateIdProp, userIdProp } from '../common/props';

export const addAttachmentToCandidateAction = createAction({
  name: 'add_attachment_to_candidate',
  displayName: 'Add Attachment to Candidate',
  description: 'Add a base64-encoded attachment to a Greenhouse candidate or prospect.',
  auth: greenhouseAuth,
  props: {
    candidateId: candidateIdProp,
    userId: userIdProp,
    filename: Property.ShortText({
      displayName: 'Filename',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content (Base64)',
      description: 'Base64-encoded file content.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'Resume', value: 'resume' },
          { label: 'Cover Letter', value: 'cover_letter' },
          { label: 'Take Home Test', value: 'take_home_test' },
          { label: 'Offer Packet / Offer Letter', value: 'offer_letter' },
          { label: 'Signed Offer Letter', value: 'signed_offer_letter' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description: 'Optional MIME type. Defaults to application/octet-stream.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description:
        'Only used when the attachment type is "other". Greenhouse ignores this for resume, cover letter, take-home test, and offer-letter types.',
      required: false,
      options: {
        options: [
          { label: 'Admin Only', value: 'admin_only' },
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, {
      method: HttpMethod.POST,
      path: `/candidates/${propsValue.candidateId}/attachments`,
      onBehalfOfUserId: propsValue.userId,
      body: compactObject({
        filename: propsValue.filename,
        content: propsValue.content,
        type: propsValue.type,
        content_type: propsValue.contentType || 'application/octet-stream',
        ...(propsValue.type === 'other' ? { visibility: propsValue.visibility } : {}),
      }),
    });
  },
});
