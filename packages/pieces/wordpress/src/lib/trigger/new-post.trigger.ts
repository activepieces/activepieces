import { createTrigger } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { wordpressCommon } from '../common';

const triggerNameInStore = 'wordpress_new_post_trigger';
export const wordpressNewPost = createTrigger({
  name: 'newPost',
  displayName: 'New Post',
  sampleData: {
    "id": 60,
    "date": "2023-02-19T10:08:25",
    "date_gmt": "2023-02-19T10:08:25",
    "guid": {
      "rendered": "https://yoursite.com/?p=60"
    },
    "modified": "2023-02-19T10:08:25",
    "modified_gmt": "2023-02-19T10:08:25",
    "slug": "post-slug",
    "status": "publish",
    "type": "post",
    "link": "/post-slug/",
    "title": {
      "rendered": "<h1> post title </h1>"
    },
    "content": {
      "rendered": "\npost content\n",
      "protected": false
    },
    "excerpt": {
      "rendered": "xxx\n",
      "protected": false
    },
    "author": 1,
    "featured_media": 0,
    "comment_status": "open",
    "ping_status": "open",
    "sticky": false,
    "template": "",
    "format": "standard",
    "meta": [],
    "categories": [
      1
    ],
    "tags": [],
    "_links": {
      "self": [
        {
          "href": "/wp-json/wp/v2/posts/60"
        }
      ],
      "collection": [
        {
          "href": "/wp-json/wp/v2/posts"
        }
      ],
      "about": [
        {
          "href": "/wp-json/wp/v2/types/post"
        }
      ],
      "author": [
        {
          "embeddable": true,
          "href": "/wp-json/wp/v2/users/1"
        }
      ],
      "replies": [
        {
          "embeddable": true,
          "href": "/wp-json/wp/v2/comments?post=60"
        }
      ],
      "version-history": [
        {
          "count": 1,
          "href": "/wp-json/wp/v2/posts/60/revisions"
        }
      ],
      "predecessor-version": [
        {
          "id": 61,
          "href": "/wp-json/wp/v2/posts/60/revisions/61"
        }
      ],
      "wp:attachment": [
        {
          "href": "/wp-json/wp/v2/media?parent=60"
        }
      ],
      "wp:term": [
        {
          "taxonomy": "category",
          "embeddable": true,
          "href": "/wp-json/wp/v2/categories?post=60"
        },
        {
          "taxonomy": "post_tag",
          "embeddable": true,
          "href": "/wp-json/wp/v2/tags?post=60"
        }
      ],
      "curies": [
        {
          "name": "wp",
          "href": "https://api.w.org/{rel}",
          "templated": true
        }
      ]
    }
  },
  description: 'Triggers when a new post is published.',
  props: {
    connection: wordpressCommon.connection,
    website_url: wordpressCommon.website_url,
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
    let payloads: unknown[] = [];
    const lastPollDate = await context.store.get<string>(triggerNameInStore);
    if (!lastPollDate) {
      throw Error("Activepieces- last poll date wasn't found");
    }

    let pageCursor = 1;
    const getPostsParams = {
      websiteUrl: context.propsValue['website_url'].toString().trim(),
      username: context.propsValue['connection']['username'],
      password: context.propsValue['connection']['password'],
      authors: context.propsValue['authors'],
      afterDate: lastPollDate,
      page: pageCursor
    };
    let newPosts = await wordpressCommon.getPosts(getPostsParams);
    //This means there is only one page
    if (newPosts.totalPages === 0) {
      payloads = [...newPosts.posts];
    }
    while (newPosts.posts.length > 0 && pageCursor <= newPosts.totalPages) {
      payloads = [...payloads, ...newPosts.posts];
      pageCursor++;
      newPosts = await wordpressCommon.getPosts({ ...getPostsParams, page: pageCursor });
    }
    const currentDate = (new Date()).toISOString();
    await context.store.put<string>(triggerNameInStore, currentDate);
    return payloads;
  },
});
