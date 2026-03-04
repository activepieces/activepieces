import { createAction, Property, httpClient } from '@activepieces/pieces-framework';

export const importDesign = createAction({
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import an existing file into Canva as a design',
  props: {},
  async run(context) {
    // TODO: implement import with async polling via httpClient
    return {};
  },
});
