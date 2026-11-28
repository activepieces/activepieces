import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDownloadFileOutputSchema } from '../../../output-schemas';

const DOWNLOAD_HOST = 'https://dl.boxcloud.com/2.0';

export const downloadZipAction = createAction({
  auth: boxAuth,
  name: 'box_download_zip',
  outputSchema: boxDownloadFileOutputSchema,
  displayName: 'Download Zip',
  description: 'Downloads a zip archive created with Create Zip Download.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the zip prepared by Create Zip Download and returns it as a file the flow can pass on. Run it right after Create Zip Download: the link expires within seconds to minutes and a started download cannot be resumed, so a new Create Zip Download is needed after a failure.',
    idempotent: false,
  },
  props: {
    zipDownloadId: boxAiProps.zipDownloadId({
      required: true,
      description: 'The ID segment of the download_url (or status_url) from Create Zip Download: the part between "/zip_downloads/" and "/content".',
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the downloaded file. Defaults to "<zip download ID>.zip".',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const download = await boxClient.download({
      auth,
      host: DOWNLOAD_HOST,
      path: `/zip_downloads/${encodeURIComponent(propsValue.zipDownloadId)}/content`,
    });
    const fileName = propsValue.fileName ?? `${propsValue.zipDownloadId}.zip`;
    const file = await files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
