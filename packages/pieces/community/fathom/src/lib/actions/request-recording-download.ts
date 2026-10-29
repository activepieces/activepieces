import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomClient } from '../common/client';
import { fathomInputs, fathomProps } from '../common/props';
import { fathomOutputSchemas } from '../output-schemas';

export const requestRecordingDownload = createAction({
  name: 'request_recording_download',
  classification: 'WRITE',
  displayName: 'Request Recording Download',
  description: 'Ask Fathom to prepare a video or audio file of a recording. Then use Get Recording Download to get the file link.',
  audience: 'both',
  aiMetadata: {
    description:
      'Starts generating a downloadable video or audio file for one Fathom recording and returns a download_id with status; audio-only recordings may complete immediately with the file URL. Then call Get Recording Download until status is completed; URLs expire after about 24 hours. Fails with 403 for limited-access shares and 422 when there is no media. Not idempotent: each call creates a new download job.',
    idempotent: false,
  },
  auth: fathomAuth,
  props: {
    recording_id: fathomProps.recordingIdText({ description: 'The numeric recording_id from New Recording or List Meetings.' }),
  },
  outputSchema: fathomOutputSchemas.download,
  async run({ auth, propsValue }) {
    const recordingId = fathomInputs.parseRecordingId({ value: propsValue.recording_id });
    return fathomClient.requestObject({ auth, method: HttpMethod.POST, path: `recordings/${recordingId}/download`, body: {} });
  },
});
