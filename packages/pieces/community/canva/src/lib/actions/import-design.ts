import { createAction } from '@activepieces/pieces-framework';

export const importDesign = createAction({
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Imports a PDF as an editable Canva design and polls for completion',
  props: {},
  async run(context) {
    // TODO: implement import + async polling
    throw new Error('importDesign not implemented');
  }
});