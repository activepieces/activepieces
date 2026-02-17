import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoPaginatedCall } from '../../common';

export const findTagByName = createAction({
  name: 'find_tag_by_name',
  auth: klaviyoAuth,
  displayName: 'Find Tag by Name',
  description: 'Locate a tag by name to manage tagging workflows.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      required: true,
    }),
  },
  async run(context) {
    const tags = await klaviyoPaginatedCall<{
      id: string;
      attributes: { name: string };
    }>(
      'tags',
      context.auth.secret_text,
      { filter: `equals(name,"${context.propsValue.name}")` }
    );
    return { data: tags };
  },
});
