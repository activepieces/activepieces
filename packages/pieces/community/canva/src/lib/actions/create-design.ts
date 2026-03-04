import { createAction } from '@activepieces/pieces-framework';

export const createDesign = createAction({
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Creates a new design in Canva based on a template',
  props: {},
  async run(context) {
    // TODO: implement design creation logic
    throw new Error('createDesign not implemented');
  }
});