import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditThing } from '../../common/client';
import { redditEditTextOutputSchema } from '../../output-schemas';

export const redditEditText = createAction({
  auth: redditAuth,
  name: 'reddit_edit_text',
  outputSchema: redditEditTextOutputSchema,
  displayName: 'Edit Post or Comment Text',
  description: 'Replaces the body text of one of your text posts or comments.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the full markdown body of a text post (t3_) or comment (t1_) you authored. Titles and link posts cannot be edited. The id must carry its type prefix; the `name` field of a post or comment is its fullname.',
    idempotent: true,
  },
  props: {
    thing_id: Property.ShortText({ displayName: 'Fullname', description: 'Fullname of your post or comment, e.g. "t3_abc123" or "t1_def456".', required: true }),
    text: Property.LongText({ displayName: 'New Text', description: 'New markdown body; replaces the existing text.', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<ThingsResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/api/editusertext',
      form: {
        api_type: 'json',
        thing_id: redditApi.requireFullname({ value: propsValue.thing_id, label: 'Fullname' }),
        text: propsValue.text,
      },
    });
    const thing = response.json.data?.things?.[0];
    return thing ? redditApi.toThing({ thing }) : { success: true };
  },
});

type ThingsResponse = {
  json: { data?: { things?: RedditThing[] } };
};
