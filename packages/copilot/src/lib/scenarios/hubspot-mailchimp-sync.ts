import { FlowTrigger } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class HubspotMailchimpSync implements Scenario<FlowTrigger> {
  title = 'Sync HubSpot Contacts to Mailchimp';

  prompt() {
    return 'Sync new HubSpot contacts to Mailchimp.';
  }
} 