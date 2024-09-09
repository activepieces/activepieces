import { smailyAuth } from '../../';
import { createAction } from '@activepieces/pieces-framework';

export const triggerAUtomationWorkflowAction = createAction({
  auth: smailyAuth,
  name: 'trigger-automation-workflow',
  displayName: 'Trigger Automation Workflow',
  description: 'Triggers automation workflow with addresses.',
  props: {},
  async run(context) {},
});
