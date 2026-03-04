import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const exportDesign = createAction({
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Export a Canva design as a file',
  props: {},
  async run(context) {
    // TODO: implement export with async polling via httpClient
    return {};
  },
});
