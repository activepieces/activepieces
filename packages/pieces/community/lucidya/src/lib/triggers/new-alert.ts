import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { lucidyaAuth } from '../../index';

export const newAlertTrigger = createTrigger({
  auth: lucidyaAuth,
  name: 'new_alert',
  displayName: 'New Alert Notification',
  description: 'Triggers when a new alert notification is generated (hourly or instant).',
  props: {
    md: Property.MarkDown({
      value: `
To use this trigger, set up a webhook in Lucidya:

1. Navigate to the **Alerts** section in Lucidya
2. Click **Create an Alert** and fill in the alert details
3. Enable the **Webhook** feature
4. Paste the webhook URL below into the webhook URL field:
   \`\`\`text
   {{webhookUrl}}
   \`\`\`
5. Test the webhook URL before saving
6. Save your alert

**Note:** Webhook will be paused if no response is received for 15 days.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    "Twitter__TrendingAlert__account_types": "{\"account_types\":[]}",
    "Twitter__TrendingAlert__dialects_and_sub_dialects": "{\"dialects\":[{\"name\":\"white\",\"value\":2}],\"sub_dialects\":[{\"name\":\"white\",\"value\":2}]}",
    "Twitter__TrendingAlert__header_alert_widget": "{\"net_sentiment\":\"neutral\",\"alert_level\":\"mild\",\"verified_authors\":1,\"negative_rate\":12.5,\"total_posts\":{\"value\":8,\"date\":\"2023-09-11 07:00:00\"},\"influencer_authors\":3,\"mentions_in_total\":8,\"total_reached_tweets\":null,\"total_reached_accounts\":null,\"increase_in_post_interactions\":0.0}",
    "Twitter__TrendingAlert__sentiment_analysis": "{\"sentiment_overtime\":{\"negative\":[{\"name\":1694512800.0,\"value\":0.3333333333333333}],\"positive\":[{\"name\":1694512800.0,\"value\":0}],\"neutral\":[{\"name\":1694512800.0,\"value\":0.6666666666666666}]},\"sentiment_piechart\":[{\"name\":\"positive\",\"value\":0},{\"name\":\"negative\",\"value\":1},{\"name\":\"neutral\",\"value\":2}]}",
    "Twitter__TrendingAlert__top_engagers": "{\"top_engagers\":[{\"id\":\"kah_aboud\",\"name\":\"عبدالرحمن\",\"data\":\"http://pbs.twimg.com/profile_images/1678432317407150081/G33l6zZ1_normal.jpg\",\"user_id\":1037466845241126912,\"verified\":\"false\",\"value\":1}]}",
    "Twitter__TrendingAlert__top_hashtags": "{\"top_hashtags\":[]}",
    "Twitter__TrendingAlert__top_influencers": "{\"top_influencers\":[{\"id\":\"mhmad95236811\",\"name\":\"طارق الزهراني\",\"data\":\"http://pbs.twimg.com/profile_images/1693071068657745920/WWKnt9Lg_normal.jpg\",\"verified\":\"false\",\"user_id\":1257804632568586243,\"value\":3769}]}",
    "Twitter__TrendingAlert__top_keywords": "{\"top_keywords\":[{\"id\":\"العين\",\"stats_count\":1},{\"id\":\"القدم\",\"stats_count\":1}]}",
    "Twitter__TrendingAlert__top_verified_engagers": "{\"top_verified_engagers\":[]}",
    "Twitter__TrendingAlert__volume_overtime": "{\"posts_over_time\":[{\"name\":1694512800.0,\"value\":8}],\"total_posts_count\":8}"
  },
  async onEnable() {
    // Webhook is manually configured in Lucidya
  },
  async onDisable() {
    // Webhook is manually removed in Lucidya
  },
  async run(context) {
    return [context.payload.body];
  },
});
