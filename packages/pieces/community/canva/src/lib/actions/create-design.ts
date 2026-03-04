import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const createDesign = createAction({
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design in Canva',
  props: {},
  async run(context) {
    // TODO: implement design creation via httpClient
    return {};
  },
});
