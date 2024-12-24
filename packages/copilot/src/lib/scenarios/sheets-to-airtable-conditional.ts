import { FlowTrigger } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class SheetsToAirtableConditional implements Scenario<FlowTrigger> {
  title = 'Google Sheets to Airtable with Value Check';

  prompt() {
    return 'Read from a Google Sheet and insert values larger than 100 to Airtable, otherwise send a failure email.';
  }
} 