import { FlowTrigger } from '../types/flow-outline';
import { Scenario } from '../types/scenario';

export class SheetsToBlogAI implements Scenario<FlowTrigger> {
  title = 'AI Blog Posts from Sheet Ideas';

  prompt() {
    return 'Use ChatGPT to write blog posts from ideas in a Google Sheet and send an email notification once it\'s done.';
  }
} 