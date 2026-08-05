import { TriggerStrategy, createTrigger, isNil } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { getPriorities } from '../common';

export const newPriority = createTrigger({
  name: 'new_priority',
  displayName: 'New Priority',
  description: 'Triggers when a new priority is created',
  aiMetadata: {
    description:
      'Fires when a new priority level is added to Jira. Each event represents one newly created priority with its metadata (name, description, color, icon). Polling-based; events arrive on the next poll, not instantly.',
  },
  auth: jiraCloudAuth,
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    self: 'https://instance.atlassian.net/rest/api/3/priority/1',
    statusColor: '#e7243d',
    description: 'The highest priority',
    iconUrl:
      'https://instance.atlassian.net/images/icons/priorities/highest.svg',
    name: 'Highest',
    id: '1',
  },
  async onEnable(context) {
    const priorities = await getPriorities({ auth: context.auth });
    const ids = priorities.map((p) => p.id).filter(Boolean);
    await context.store.put('priorityIds', JSON.stringify(ids));
  },
  async onDisable(context) {
    await context.store.delete('priorityIds');
  },
  async run(context) {
    const priorities = await getPriorities({ auth: context.auth });

    if (isNil(priorities) || priorities.length === 0) {
      return [];
    }

    const existingIds = (await context.store.get<string>('priorityIds')) ?? '[]';
    const parsedExistingIds = JSON.parse(existingIds) as string[];

    const newPriorities = priorities.filter(
      (p) => p.id && !parsedExistingIds.includes(p.id)
    );

    if (newPriorities.length === 0) {
      return [];
    }

    const newIds = newPriorities.map((p) => p.id).filter(Boolean);
    await context.store.put(
      'priorityIds',
      JSON.stringify([...newIds, ...parsedExistingIds])
    );

    return newPriorities;
  },
  async test(context) {
    const priorities = await getPriorities({ auth: context.auth });

    if (isNil(priorities)) {
      return [];
    }

    return priorities;
  },
});
