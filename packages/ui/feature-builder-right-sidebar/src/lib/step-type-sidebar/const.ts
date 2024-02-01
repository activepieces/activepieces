import { Trigger, Action } from '@activepieces/shared';

export type ActionOrTriggerName = {
  name: Trigger['name'] | Action['name'];
  displayName: Trigger['displayName'] | Action['displayName'];
};
