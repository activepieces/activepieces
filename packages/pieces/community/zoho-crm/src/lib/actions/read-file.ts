import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { downloadToFile, lastPathSegment } from '../common/download';

export const readFile = createAction({
  auth: zohoCrmAuth,
  name: 'read-file',
  classification: 'READ',
  displayName: 'Read file',
  description: 'Download a file content from Zoho CRM. e.g.: a Backup File',
  audience: 'both',
  aiMetadata: {
    description:
      'Downloads the binary content of a Zoho CRM file (e.g. a data backup or bulk-read result) from its full https URL and returns it as a stored file. Only URLs on the connection\'s own Zoho API host under /crm/ or its data centre\'s download host are accepted, because the token is sent with the request. The file size limit of this Activepieces deployment applies. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Full https URL on your Zoho API host (/crm/...) or download host.',
      required: true,
      defaultValue: '',
    }),
  },
  run: async ({ auth, propsValue, files }) => {
    const url = propsValue['url'].trim();
    const fileName = lastPathSegmentOf(url);
    const downloaded = await downloadToFile({ auth, url, files, fileName });
    return downloaded.file;
  },
});

function lastPathSegmentOf(url: string): string | undefined {
  try {
    return lastPathSegment(new URL(url));
  } catch {
    return undefined;
  }
}
