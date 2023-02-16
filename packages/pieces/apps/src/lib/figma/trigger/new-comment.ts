import { createTrigger, TriggerStrategy, Property, assertNotNullOrUndefined } from "@activepieces/framework";
import { figmaAuth } from '../common/props';
import { Comment } from '../common/models';
import { figmaCommon } from "../common";
import { figmaGetRequest } from '../common/utils';

type TriggerData = {
  lastCommentCreatedAt: string;
}

const TRIGGER_DATA_STORE_KEY = 'figma_new_comment_trigger_data'

export const newCommentTrigger = createTrigger({
  name: 'new_comment',
  displayName: 'New comment',
  description: 'Triggers when a new comment is posted',
  // Update: There's a new Figma API v2 in open beta that supports webhooks!
  // https://www.figma.com/developers/api#webhooks_v2
  type: TriggerStrategy.POLLING,
  sampleData: [{
    "id": "123456789",
    "uuid": null,
    "file_key": "abc123DEF456ghi789JKLm",
    "parent_id": "",
    "user": {
      "handle": "User Name",
      "img_url": "https://s3-alpha.figma.com/profile/profile-id",
      "id": "123456789123"
    },
    "created_at": "2023-02-13T00:00:00.000Z",
    "resolved_at": null,
    "message": "New comment",
    "reactions": [],
    "client_meta": {
      "x": 0,
      "y": 0
    },
    "order_id": "1"
  }],
  props: {
    authentication: figmaAuth,
    file_key: Property.ShortText({
      displayName: 'File Key',
      description: 'The Figma file key (copy from Figma file URL)',
      required: true,
    }),
  },

  async onEnable({ store }): Promise<void> {
    // trigger only for comments later than now
    await store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
      lastCommentCreatedAt: new Date().toISOString(),
    });
  },

  async onDisable({ store }): Promise<void> {
    await store.put(TRIGGER_DATA_STORE_KEY, null);
  },

  async run({ propsValue, store }): Promise<Comment[][]> {
    const token = propsValue.authentication?.access_token
    const fileKey = propsValue.file_key;
    const newComments: Comment[] = [];

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(fileKey, 'file_key');
    
    const url = `${figmaCommon.baseUrl}/${figmaCommon.comments}`.replace(':file_key', fileKey);

    const lastTriggerData = await store.get<TriggerData>(TRIGGER_DATA_STORE_KEY);
    const lastCommentCreatedAt = Date.parse(`${lastTriggerData?.lastCommentCreatedAt}`);
    if (isNaN(lastCommentCreatedAt)) return [];

    const response = await figmaGetRequest({ token, url });
    const comments = response.response_body['comments'];

    let latestCommentCreatedAt = 0;
    let latestCommentCreatedAtString = "";

    if (!comments || comments.length < 1) return [];
    
    // find all new comments and store the created_at value of the latest comment
    for (let i = 0; i < comments.length; i++) {
      const commentCreatedAtString = `${comments[i].created_at}`
      const commentCreatedAt = Date.parse(commentCreatedAtString);
      if (isNaN(commentCreatedAt)) continue;
      if (commentCreatedAt > lastCommentCreatedAt) {
        newComments.push(comments[i]);
        if (commentCreatedAt > latestCommentCreatedAt) {
          latestCommentCreatedAt = commentCreatedAt;
          latestCommentCreatedAtString = commentCreatedAtString;
        }
      }
    }

    if (newComments.length < 1) return [];

    await store.put<TriggerData>(TRIGGER_DATA_STORE_KEY, {
      lastCommentCreatedAt: latestCommentCreatedAtString,
    });

    // trigger one run with all new comments
    return [newComments];
  },
})
