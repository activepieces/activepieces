import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const createAttachment = createAction({
  auth: salesforceAuth,
  name: 'create_attachment',
  displayName: 'Create Attachment',
  description: 'Creates an Attachment in Salesforce',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the attachment file',
      required: true,
    }),
    parentId: Property.ShortText({
      displayName: 'Parent ID',
      description: 'ID of the parent record (Account, Contact, Case, etc.)',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body (Base64)',
      description: 'Base64-encoded file content',
      required: true,
    }),
    contentType: Property.ShortText({
      displayName: 'Content Type',
      description: 'MIME type of the file (e.g., application/pdf, image/png)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the attachment',
      required: false,
    }),
  },
  async run(context) {
    const { name, parentId, body, contentType, description } =
      context.propsValue;

    const attachmentData: Record<string, unknown> = {
      Name: name,
      ParentId: parentId,
      Body: body,
      ...(contentType && { ContentType: contentType }),
      ...(description && { Description: description }),
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/sobjects/Attachment',
      attachmentData
    );
    return response.body;
  },
});

