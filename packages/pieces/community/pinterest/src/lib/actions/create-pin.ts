import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { boardIdDropdown } from '../common/props';

export const createPin = createAction({
  auth: pinterestAuth,
  name: 'createPin',
  displayName: 'Create Pin',
  description: 'Upload an image or video to create a new Pin on a board.',
  props: {
    board_id: boardIdDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description: 'The title of the pin.'
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
      description: 'The description of the pin.'
    }),
    media_url: Property.ShortText({
      displayName: 'Image/Video URL',
      required: true,
      description: 'The URL of the image or video to upload.'
    }),
    link: Property.ShortText({
      displayName: 'Destination Link',
      required: false,
      description: 'The destination link for the pin.'
    })
  },
  async run({ auth, propsValue }) {
    const { board_id, title, description, media_url, link } = propsValue;
    const body: any = {
      board_id,
      title,
      media_source: {
        source_type: 'image_url',
        url: media_url
      }
    };
    if (description) body.description = description;
    if (link) body.link = link;
    return await makeRequest(auth as string, HttpMethod.POST, '/pins', body);
  },
});
