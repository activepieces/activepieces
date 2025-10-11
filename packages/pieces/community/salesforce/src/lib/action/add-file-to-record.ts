import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const addFileToRecord = createAction({
  auth: salesforceAuth,
  name: 'add_file_to_record',
  displayName: 'Add File to Record',
  description: 'Adds an existing file (ContentDocument) to an existing record in Salesforce',
  props: {
    contentDocumentId: Property.ShortText({
      displayName: 'Content Document ID',
      description: 'ID of the ContentDocument (file) to link',
      required: true,
    }),
    linkedEntityId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record to link the file to (Account, Contact, Case, etc.)',
      required: true,
    }),
    shareType: Property.StaticDropdown({
      displayName: 'Share Type',
      description: 'Type of sharing for the file',
      required: false,
      options: {
        options: [
          { label: 'Viewer', value: 'V' },
          { label: 'Collaborator', value: 'C' },
          { label: 'Inferred', value: 'I' },
        ],
      },
      defaultValue: 'V',
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Visibility of the file',
      required: false,
      options: {
        options: [
          { label: 'All Users', value: 'AllUsers' },
          { label: 'Internal Users', value: 'InternalUsers' },
          { label: 'Shared Users', value: 'SharedUsers' },
        ],
      },
      defaultValue: 'AllUsers',
    }),
  },
  async run(context) {
    const { contentDocumentId, linkedEntityId, shareType, visibility } =
      context.propsValue;

    const contentDocumentLinkData: Record<string, unknown> = {
      ContentDocumentId: contentDocumentId,
      LinkedEntityId: linkedEntityId,
      ...(shareType && { ShareType: shareType }),
      ...(visibility && { Visibility: visibility }),
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/sobjects/ContentDocumentLink',
      contentDocumentLinkData
    );
    return response.body;
  },
});

