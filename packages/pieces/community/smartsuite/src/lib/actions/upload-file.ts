import { createAction, Property } from '@activepieces/pieces-framework';
import { SmartSuiteClient } from '../common/client';
import { appIdDropdown } from '../common/props';

export const uploadFileAction = createAction({
  name: 'upload_file',
  displayName: 'Attach File',
  description: 'Attach a file from a URL to a specific record in SmartSuite',
  props: {
    appId: appIdDropdown,
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The ID of the record to attach the file to',
      required: true,
    }),
    fieldSlug: Property.ShortText({
      displayName: 'Field Slug',
      description: 'The field slug (identifier) of the file field in SmartSuite',
      required: true,
    }),
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'The URL of the file to attach',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { appId, recordId, fieldSlug, fileUrl } = propsValue;
    const authValue = auth as { apiKey: string; workspaceId: string };
    const client = new SmartSuiteClient(authValue.apiKey, authValue.workspaceId);

    return await client.attachFileToRecord(appId, recordId, fieldSlug, fileUrl);
  },
});
