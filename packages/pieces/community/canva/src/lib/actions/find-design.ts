import { createAction } from '@activepieces/pieces-framework';

export const findDesign = createAction({
  name: 'find_design',
  displayName: 'Find Design',
  description: 'Searches for existing designs in Canva to avoid duplicates',
  props: {},
  async run(context) {
    // TODO: implement design search
    throw new Error('findDesign not implemented');
  }
});