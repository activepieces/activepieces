import { FlowType } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class NewRowGoogleSheetsSendSlackMessage
  implements Scenario<FlowType>
{
  title = 'New Row Google Sheets Send Slack Message';

  prompt() {
    return 'When a new row is added to a Google Sheets spreadsheet, send a message to a Slack channel.';
  }
}
