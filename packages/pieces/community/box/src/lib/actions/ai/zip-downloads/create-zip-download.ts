import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const createZipDownloadAction = createAction({
  auth: boxAuth,
  name: 'box_create_zip_download',
  displayName: 'Create Zip Download',
  description: 'Starts a zip download of Box files and folders.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Packs up to 10,000 files and folders into one zip and returns its download_url and status_url, valid for a limited time. Fetch the zip with Download Zip and check progress with Get Zip Download Status.',
    idempotent: false,
  },
  props: {
    items: Property.Json({
      displayName: 'Items',
      description: 'The items to zip: [{"type": "file", "id": "123"}, {"type": "folder", "id": "456"}].',
      required: true,
    }),
    downloadFileName: Property.ShortText({
      displayName: 'Zip Name',
      description: 'Name of the zip file, without ".zip".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/zip_downloads',
      body: {
        items: propsValue.items,
        ...(propsValue.downloadFileName !== undefined ? { download_file_name: propsValue.downloadFileName } : {}),
      },
    });
  },
});
