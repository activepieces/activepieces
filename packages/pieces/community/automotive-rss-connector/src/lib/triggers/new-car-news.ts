import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';

export const newCarNewsTrigger = createTrigger({
  name: 'new_car_news',
  displayName: 'New Car News',
  description: 'Triggers when a new item appears in the automotive RSS feed.',
  type: TriggerStrategy.POLLING,

  props: {
    feedUrl: Property.ShortText({
      displayName: 'RSS Feed URL',
      description: 'The URL of the RSS feed to monitor.',
      required: true,
    }),
  },

  sampleData: {
    title: 'Sample Car News Title',
    link: 'https://example.com/news',
  },

  async onEnable() {
    // Called when trigger is turned on
  },

  async onDisable() {
    // Called when trigger is turned off
  },

  async run(context) {
    const feedUrl = context.propsValue.feedUrl;
    console.log('Monitoring feed:', feedUrl);
    return [];
  },
});