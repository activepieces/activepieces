import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getZipDownloadStatusAction = createAction({
  auth: boxAuth,
  name: 'box_get_zip_download_status',
  displayName: 'Get Zip Download Status',
  description: 'Gets the progress of a Box zip download.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads once the state (in_progress, succeeded, failed) and the downloaded and skipped item counts of a zip download. Only works after Download Zip has started, for 12 hours. Get the ID from the status_url of Create Zip Download.',
    idempotent: true,
  },
  props: {
    zipDownloadId: boxAiProps.zipDownloadId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/zip_downloads/${encodeURIComponent(propsValue.zipDownloadId)}/status`,
    });
  },
});
