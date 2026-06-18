import { createAction, Property } from '@activepieces/pieces-framework';
import { getHelp, HELP_TOPIC_LIST } from '@atomicmail/agentic-core';

export const helpAction = createAction({
  requireAuth: false,
  name: 'help',
  displayName: 'Help',
  description:
    'Runtime docs for presets, cron polling, troubleshooting, and more.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch Atomic Mail runtime help (overview, presets, cron, troubleshooting, …). Call before custom jmap_request ops. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    topic: Property.StaticDropdown({
      displayName: 'Help topic',
      description: 'Choose a topic, or leave as Overview for a quick start',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Overview', value: 'overview' },
          ...HELP_TOPIC_LIST.filter((t) => t !== 'overview').map((topic) => ({
            label: topic.replace(/_/g, ' '),
            value: topic,
          })),
        ],
      },
    }),
  },
  async run(context) {
    const topic = context.propsValue.topic ?? undefined;
    const text = await getHelp(topic, 'skill');
    return { topic: topic ?? 'overview', text };
  },
});
