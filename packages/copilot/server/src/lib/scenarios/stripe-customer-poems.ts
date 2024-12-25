import { FlowType } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class StripeCustomerPoems implements Scenario<FlowType> {
  title = 'Stripe Customer Poems to WordPress';

  prompt() {
    return 'Write poems about new stripe customers and post them as wordpress posts.';
  }
}
