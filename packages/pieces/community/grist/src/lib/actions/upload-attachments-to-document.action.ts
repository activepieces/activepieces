import { gristAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import FormData from 'form-data';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { GristAPIClient } from '../common/helpers';

export const gristUploadAttachmentsToDocumnetAction = createAction({
  auth: gristAuth,
  name: 'grist-upload-attachments-to-document',
  displayName: 'Upload Attachment to Document',
  description: 'Uploads attachments to specific document.',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file as an attachment to a specific Grist document and returns its attachment metadata. Use it to store a file in Grist before referencing it from an attachment-type column; requires the document identifier and a file. Not idempotent — each call uploads a new attachment with a fresh ID.', idempotent: false },
  props: {
    workspace_id: commonProps.workspace_id,
    document_id: commonProps.document_id,
    attachment: Property.File({
      displayName: 'Attachment',
      required: true,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'In case you want to change the name of the attachment.',
      required: false,
    }),
  },
  async run(context) {  
    const documentId = context.propsValue.document_id;
    const attachment = context.propsValue.attachment;
    const attachmentName = context.propsValue.attachment_name;

    const client = new GristAPIClient({
      domainUrl: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
    });

    const formData = new FormData();
    formData.append(
      'upload',
      Buffer.from(attachment.base64, 'base64'),
      attachmentName || attachment.filename
    );

    const response = await httpClient.sendRequest<Array<number>>({
      method: HttpMethod.POST,
      url: context.auth.props.domain + '/api' + `/docs/${documentId}/attachments`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.props.apiKey,
      },
      headers: { ...formData.getHeaders() },
      body: formData,
    });

    const attachmentId = response.body[0];

    const attachmentMetadata = await client.getDocumentAttachmentMetadata(
      documentId,
      attachmentId
    );

    return {
      id: attachmentId,
      fields: attachmentMetadata,
    };
  },
});
