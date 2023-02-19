import { createTrigger, TriggerStrategy } from '@activepieces/framework';
import { wordpressCommon } from '../common';

const triggerNameInStore = 'wordpress_new_post_trigger';
export const wordpressNewPost = createTrigger({
  name: 'newPost',
  displayName: 'New Post',
  sampleData: {
    "id": 11,
    "date": "2023-02-16T10:14:31",
    "date_gmt": "2023-02-16T10:14:31",
    "guid": {
      "rendered": "http://eample-website.com/?p=11"
    },
    "modified": "2023-02-16T10:14:31",
    "modified_gmt": "2023-02-16T10:14:31",
    "slug": "zxc",
    "status": "publish",
    "type": "post",
    "link": "http://example-website.com/zxc/",
    "title": {
      "rendered": "title"
    },
    "content": {
      "rendered": "\n<p>zxczxc</p>\n",
      "protected": false
    },
    "excerpt": {
      "rendered": "<p>zxczxc</p>\n",
      "protected": false
    },
    "featured_media": 0,
    "comment_status": "open",
    "ping_status": "open",
    "sticky": false,
    "template": "",
    "format": "standard",

  },
  description: 'Triggers when a new post is published.',
  props: {
    connection: wordpressCommon.connection,
    websiteUrl: wordpressCommon.websiteUrl,
    authors: wordpressCommon.authors
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const currentDate = (new Date()).toISOString();
    await context.store?.put<string>(triggerNameInStore, currentDate);
  },
  async onDisable(context) {
    await context.store.put<undefined>(triggerNameInStore, undefined);
  },
  async run(context) {
    const payloads: unknown[] = [];
    const lastPollDate = await context.store.get<string>(triggerNameInStore);
    if (!lastPollDate) {
      throw Error("Activepieces- last poll date wasn't found");
    }
    let pageCursor = 0;
    let newPosts = await wordpressCommon.getPosts({
      websiteUrl: context.propsValue['websiteUrl'],
      username: context.propsValue['connection']['username'],
      password: context.propsValue['connection']['password'],
      authors: context.propsValue['authors'],
      afterDate: lastPollDate,
      page: pageCursor
    })
    while (newPosts.length > 0) {
      payloads.push(newPosts);
      pageCursor++;
      newPosts = await wordpressCommon.getPosts({
        websiteUrl: context.propsValue['websiteUrl'],
        username: context.propsValue['connection']['username'],
        password: context.propsValue['connection']['password'],
        authors: context.propsValue['authors'],
        afterDate: lastPollDate,
        page: pageCursor
      });
    }
    const currentDate = (new Date()).toISOString();
    await context.store.put<string>(triggerNameInStore, currentDate);
    return payloads;
  },
});
