import { FlowType } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class RegularDiscordMessage implements Scenario<FlowType> {
  title = 'Regular Discord Messages';

  prompt() {
    return 'Send a discord message every 2 minutes.';
  }
}
