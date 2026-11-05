import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomClient } from '../common/client';
import { fathomInputs, fathomProps } from '../common/props';
import { fathomOutputSchemas } from '../output-schemas';

export const getRecordingDownload = createAction({
  name: 'get_recording_download',
  classification: 'READ',
  displayName: 'Get Recording Download',
  description: 'Check a download started with Request Recording Download and get the file link once it is ready.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the status of a Fathom recording download (processing, completed, failed, expired) and, once completed, the signed file URL, content type, size and expiry. Only works for downloads created by this same connection. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    recording_id: fathomProps.recordingIdText({ description: 'The numeric recording_id the download was requested for.' }),
    download_id: Property.ShortText({ displayName: 'Download ID', description: 'The download_id returned by Request Recording Download.', required: true }),
  },
  outputSchema: fathomOutputSchemas.download,
  async run({ auth, propsValue }) {
    const recordingId = fathomInputs.parseRecordingId({ value: propsValue.recording_id });
    const downloadId = fathomInputs.optionalText({ value: propsValue.download_id });
    if (downloadId === undefined || !/^[A-Za-z0-9_-]{1,128}$/.test(downloadId)) {
      throw new Error('Download ID must be the download_id returned by Request Recording Download (letters, digits, _ and -).');
    }
    return fathomClient.requestObject({ auth, method: HttpMethod.GET, path: `recordings/${recordingId}/downloads/${downloadId}` });
  },
});
