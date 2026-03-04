import { createAction } from '@activepieces/pieces-framework';

export const exportDesign = createAction({
  name: 'export_design',
  displayName: 'Export Design',
  description: 'Exports a Canva design to PDF and polls for job completion',
  props: {},
  async run(context) {
    // TODO: implement export + async polling
    throw new Error('exportDesign not implemented');
  }
});