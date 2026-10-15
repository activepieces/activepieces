import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { gristAuth } from '../../auth';
import { GristAPIClient } from '../../common/helpers';
import { commonProps } from '../../common/props';
import { gristUploadAttachmentOutputSchema } from '../../output-schemas';

export const gristUploadAttachmentAction = createAction({
  auth: gristAuth,
  name: 'grist_upload_attachment',
  outputSchema: gristUploadAttachmentOutputSchema,
  displayName: 'Upload Attachment',
  description: 'Uploads a file to a document.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a file into a Grist document and returns its attachment ID and metadata. To show it in a table, set an Attachments column cell to `["L", <attachmentId>]` with **Update Records**. Not idempotent: each call stores a new attachment.',
    idempotent: false,
  },
  props: {
    documentId: commonProps.document_id_text,
    attachment: Property.File({
      displayName: 'Attachment',
      required: true,
    }),
    attachmentName: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Overrides the file name.',
      required: false,
    }),
  },
  async run(context) {
    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });
    const { documentId, attachment, attachmentName } = context.propsValue;
    const formData = new FormData();
    formData.append(
      'upload',
      Buffer.from(attachment.base64, 'base64'),
      attachmentName || attachment.filename
    );
    const uploaded = await client.makeRequest<number[]>(
      HttpMethod.POST,
      `/docs/${documentId}/attachments`,
      { ...formData.getHeaders() },
      undefined,
      formData
    );
    const id = uploaded[0];
    const metadata = await client.makeRequest<{ fileName?: string }>(
      HttpMethod.GET,
      `/docs/${documentId}/attachments/${id}`,
      undefined,
      undefined
    );
    return { id, fields: metadata };
  },
});
