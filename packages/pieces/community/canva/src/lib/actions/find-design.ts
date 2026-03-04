import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const findDesign = createAction({
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Search for existing designs in Canva',
  props: {},
  async run(context) {
    // TODO: implement design search via httpClient
    return {};
  },
});
