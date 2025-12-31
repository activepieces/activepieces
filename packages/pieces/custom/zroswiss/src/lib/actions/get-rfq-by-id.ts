import { createAction } from '@activepieces/pieces-framework';

export const getRfqById = createAction({
  name: 'getRfqById',
  displayName: 'Get RFQ by ID',
  description: 'Search rfq by id',
  props: {},
  async run(context) {
    // Action logic here
    console.log('start get rfq by id action', context);
    return {
      success: true,
      message: 'RFQ fetched successfully',
    };
  },
});
