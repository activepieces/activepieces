import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { ninoxAuth } from '../../index';

export const updatedRecord = createTrigger({
  auth: ninoxAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Triggers when a record is updated in a Ninox table.',
  type: TriggerStrategy.POLLING,
  props: {
    databaseId: Property.ShortText({
      displayName: 'Database ID',
      required: true,
    }),
    tableId: Property.ShortText({
      displayName: 'Table ID',
      required: true,
    }),
  },
  sampleData: {},
  async run({ auth, propsValue, store }) {
    // TODO: Implement polling logic for updated records
    return [];
  },
  async onEnable({ auth, propsValue, store }) {
    // TODO: Implement onEnable logic if needed
  },
  async onDisable({ auth, propsValue, store }) {
    // TODO: Implement onDisable logic if needed
  },
}); 