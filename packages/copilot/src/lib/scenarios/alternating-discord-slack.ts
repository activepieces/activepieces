import { FlowTrigger } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class AlternatingDiscordSlack implements Scenario<FlowTrigger> {
  title = 'Alternating Discord and Slack Messages';

  prompt() {
    return 'Every 10 hours, send a discord message or a slack message alternatively.';
  }
} 