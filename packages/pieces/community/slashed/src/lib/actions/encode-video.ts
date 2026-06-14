import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { slashedAuth } from '../../';

export const encodeVideoAction = createAction({
  auth: slashedAuth,
  name: 'encode_video',
  displayName: 'Encode a Video',
  description: 'Requests a video encoding job on slashed.cloud.',
  audience: 'both',
  aiMetadata: { description: 'Submits a new AV1 video encoding/transcoding job to slashed.cloud for a given service ID, pointing at a source file (path or URL in the service\'s configured storage) and a `jobs` array of operations to apply. Use to kick off transcoding; optionally set a callback URL to be POSTed when encoding completes. Not idempotent — each call queues a separate encoding job.', idempotent: false },
  props: {
    service_id: Property.Number({
      displayName: 'Service ID',
      description:
        'Your service ID from the slashed.cloud dashboard. Found under your service settings.',
      required: true,
    }),
    source: Property.ShortText({
      displayName: 'Source File',
      description:
        'Path or URL of the source video file in the storage you have configured for your service.',
      required: true,
    }),
    jobs: Property.Json({
      displayName: 'Jobs',
      description:
        'Array of encoding job objects to apply to the source file. Each object must include a `type` field specifying the job type (e.g. `{ "type": "encode", "output": "output.mp4" }`).',
      required: true,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Processing priority for this encoding request.',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    callback: Property.ShortText({
      displayName: 'Callback URL',
      description:
        'Optional URL to receive a POST request when encoding completes. Slashed will send the result to this endpoint.',
      required: false,
    }),
  },
  async run(context) {
    const { service_id, source, jobs, priority, callback } = context.propsValue;

    const body: Record<string, unknown> = {
      service_id,
      source,
      jobs,
    };

    if (priority) body['priority'] = priority;
    if (callback) body['callback'] = callback;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://venc.slashed.cloud/request',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
