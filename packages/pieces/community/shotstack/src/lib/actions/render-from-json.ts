import { createAction, Property } from '@activepieces/pieces-framework';
import { shotstackAuth } from '../auth';
import { shotstackApi } from '../common';

export const renderFromJson = createAction({
  auth: shotstackAuth,
  name: 'render_from_json',
  classification: 'WRITE',
  displayName: 'Render From JSON',
  description: 'Renders a video, image or audio file from a Shotstack edit.',
  audience: 'both',
  aiMetadata: {
    description:
      'Render a video, image or audio file from a full Shotstack edit (timeline plus output settings). Use when you have the edit JSON; use Render Template for a template saved in the account. Each call starts and bills a new render, so retries duplicate.',
    idempotent: false,
  },
  props: {
    edit: Property.Json({
      displayName: 'Edit (JSON)',
      description:
        'A Shotstack edit: a `timeline` of tracks and clips, plus `output` settings. Paste one from the [Shotstack docs](https://shotstack.io/docs/guide/) or Studio, or map JSON that an AI step wrote. For renders longer than 8 minutes, turn off waiting and add a `callback` URL to the edit, such as a Catch Webhook trigger in another flow: Shotstack posts the result there.',
      required: true,
      defaultValue: {
        timeline: {
          tracks: [
            {
              clips: [
                {
                  asset: { type: 'title', text: 'Hello from Activepieces', style: 'minimal' },
                  start: 0,
                  length: 3,
                },
              ],
            },
          ],
        },
        output: { format: 'mp4', resolution: 'sd' },
      },
    }),
    wait: shotstackApi.renderWait,
  },
  async run({ auth, propsValue }) {
    return shotstackApi.startRender({
      connection: auth.props,
      path: '/render',
      body: shotstackApi.parseObject({ value: propsValue.edit, label: 'Edit' }),
      wait: propsValue.wait,
    });
  },
});
