import { createAction, Property } from '@activepieces/pieces-framework';
import { shotstackAuth } from '../auth';
import { shotstackApi } from '../common';

export const getRenderStatus = createAction({
  auth: shotstackAuth,
  name: 'get_render_status',
  classification: 'READ',
  displayName: 'Get Render Status',
  description: 'Gets the status of a render and, once it is done, its file URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the status (done, failed, or an in-progress state such as queued or rendering) and, when done, the file URL of a Shotstack render by its ID. Use after Render From JSON or Render Template ran without waiting; turn on wait to block until the render ends (up to 8 minutes). Safe to retry.',
    idempotent: true,
  },
  props: {
    render_id: Property.ShortText({
      displayName: 'Render ID',
      description: 'The ID a Render From JSON or Render Template step returned.',
      required: true,
    }),
    wait: Property.Checkbox({
      displayName: 'Wait for the Render to Finish',
      description:
        'On: the step keeps checking for up to 8 minutes and returns the file URL, or stops with the reason if the render failed. Off: it returns the current status straight away.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = propsValue.render_id.trim();
    if (propsValue.wait) {
      return shotstackApi.waitForRender({ connection: auth.props, id });
    }
    return shotstackApi.summary(await shotstackApi.getRender({ connection: auth.props, id }));
  },
});
