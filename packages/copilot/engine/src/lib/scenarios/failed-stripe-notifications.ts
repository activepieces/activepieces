import { Flow, FlowType } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class FailedStripeNotifications implements Scenario<FlowType> {
  title = 'Failed Stripe Payment Notifications';

  prompt() {
    return 'Receive slack notifications about stripe payments when they don\'t go through.';
  }
} 