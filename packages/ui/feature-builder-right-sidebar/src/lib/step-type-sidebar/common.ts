import { ActionBase } from '@activepieces/pieces-framework';

export type ActionOrTriggerName = Pick<ActionBase, 'name' | 'displayName'>;
