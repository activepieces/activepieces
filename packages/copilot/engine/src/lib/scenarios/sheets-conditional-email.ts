import { Flow, FlowType } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class SheetsConditionalEmail implements Scenario<FlowType> {
  title = 'Send Email for Specific Names in Sheet';

  prompt() {
    return 'Read rows from a Google Sheet and only send email if the name is ahmad.';
  }
} 