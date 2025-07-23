import { createAction, Property } from '@activepieces/pieces-framework';

export const stopFlow = createAction({
  name: 'stopFlow',
  displayName: 'Stop flow',
  description: 'Stops the flow immediately this step is reached',
  props: {},
  async run(context) {
    context.run.stop();
  },
});
