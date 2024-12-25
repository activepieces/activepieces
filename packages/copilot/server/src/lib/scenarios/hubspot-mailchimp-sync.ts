import { FlowType } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class HubspotMailchimpSync implements Scenario<FlowType> {
  title = 'Sync HubSpot Contacts to Mailchimp';

  prompt() {
    return 'Sync new HubSpot contacts to Mailchimp.';
  }
}
