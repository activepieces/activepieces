import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { VlmRunAuth } from '../common/auth';

export const analyzeVideo = createAction({
  auth: VlmRunAuth,
  name: 'analyze_video',
  displayName: 'Analyze Video',
  description: 'Analyze a video file or URL (extract frames, detect content, generate summaries, etc.)',
  props: {
    domain: Property.StaticDropdown({
      displayName: 'Domain',
      description: 'Choose the domain identifier for the model',
      required: true,
      options: {
        options: [
          { label: 'Video Transcription', value: 'video.transcription' },
          { label: 'Video Transcription Summary', value: 'video.transcription-summary' },
          { label: 'Product Demo Summary', value: 'video.product-demo-summary' },
          { label: 'Conferencing Summary', value: 'video.conferencing-summary' },
          { label: 'Podcast Summary', value: 'video.podcast-summary' },
          { label: 'Video Summary', value: 'video.summary' },
          { label: 'Dashcam Analytics', value: 'video.dashcam-analytics' },
        ],
      },
    }),
    url: Property.ShortText({
      displayName: 'Video URL',
      description: 'Publicly accessible video URL (provide either URL or File ID)',
      required: false,
    }),
    file_id: Property.ShortText({
      displayName: 'File ID',
      description: 'ID of an uploaded file (alternative to URL)',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Optional URL to call when the request completes',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use for generating the response',
      required: false,
      defaultValue: 'vlm-1',
      options: {
        options: [{ label: 'vlm-1', value: 'vlm-1' }],
      },
    }),
    batch: Property.Checkbox({
      displayName: 'Batch (async)',
      description: 'Whether to process the video in batch mode (async)',
      required: false,
      defaultValue: true,
    }),
    config: Property.Json({
      displayName: 'Config',
      description: 'Optional analysis config (e.g., frame_interval, detect_objects)',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'Optional metadata to pass with the request',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      domain: propsValue.domain,
      url: propsValue.url,
      file_id: propsValue.file_id,
      callback_url: propsValue.callback_url,
      model: propsValue.model,
      batch: propsValue.batch,
      config: propsValue.config,
      metadata: propsValue.metadata,
    };

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      `/video/generate`,
      body
    );
    return response;
  },
});
