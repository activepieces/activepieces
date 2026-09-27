import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import { contentTypeOf, puppetflowRawRequest, runPath } from '../common/client';
import { credentialsOf, flowIdDropdown, runIdDropdown } from '../common/props';

export const downloadRecordingAction = createAction({
  auth: puppetflowAuth,
  name: 'download_recording',
  displayName: 'Download Recording',
  description: 'Download the session recording of a run as MP4, or its last frame as JPEG',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Downloads the browser session recording of a Puppetflow run as an MP4 video, or only its final frame as a JPEG image, and returns it as a file. Recording must be enabled in the flow settings. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    flowId: flowIdDropdown,
    runId: runIdDropdown,
    lastFrameOnly: Property.Checkbox({
      displayName: 'Last Frame Only',
      description: 'Download the final frame as a JPEG image instead of the full video',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { flowId, runId, lastFrameOnly } = context.propsValue;
    const path = lastFrameOnly
      ? `${runPath(flowId, runId)}/recording/lastshot`
      : `${runPath(flowId, runId)}/recording`;
    const fileName = lastFrameOnly
      ? `recording-run-${runId}-lastshot.jpg`
      : `recording-run-${runId}.mp4`;

    const response = await puppetflowRawRequest<Buffer>({
      credentials: credentialsOf(context.auth),
      method: HttpMethod.GET,
      path,
      responseType: 'arraybuffer',
    });

    const file = await context.files.write({
      fileName,
      data: Buffer.from(response.body),
    });

    return {
      run_id: runId,
      filename: fileName,
      content_type: contentTypeOf(
        response.headers,
        lastFrameOnly ? 'image/jpeg' : 'video/mp4'
      ),
      file,
    };
  },
});
