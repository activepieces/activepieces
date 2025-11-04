import { zagomailAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { zagoMailApiService } from '../common/request';
import { Tag } from '../common/constants';
import { listUId } from '../common/props';

export const tagSubscriber = createAction({
  auth: zagomailAuth,
  name: 'tagSubscriber',
  displayName: 'Tag Subscriber',
  description: 'Adds A Tag to A Subscriber.',
  props: {
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Add one or more tags you would like to add to this subscriber.',
      required: true,
    }),
    listUId:listUId,
    subscriberUid: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber you want to add the tag to.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const providedTags = propsValue.tags as string[];

    if (providedTags.length < 1)
      throw new Error('You must provide atleast one tag');

    const tags = (await zagoMailApiService.getTags(auth)) as Tag[];

    return await Promise.all(
      providedTags.map(async (providedTag) => {
        const tagExists = tags.find((t) => t.ztag_name === providedTag);

        let tag;

        if (tagExists) {
          tag = tagExists;
        } else {
          tag = (await zagoMailApiService.createTag(auth, providedTag)) as Tag;
        }

        return await zagoMailApiService.addTagToSubscriber(auth, {
          listUid: propsValue.listUId,
          subscriberUid: propsValue.subscriberUid,
          tagId: tag.ztag_id,
        });
      })
    );
  },
});
