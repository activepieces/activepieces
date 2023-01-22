import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { googleSheetsCommon } from '../common/common';

export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row',
  description: 'Triggers when there is a new row added',
  props: {
    authentication: googleSheetsCommon.authentication,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
   },
  async onDisable(context) { },
  async run(context) {
    return [context.payload];
  },
});

