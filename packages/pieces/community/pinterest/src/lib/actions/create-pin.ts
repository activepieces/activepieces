import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { adAccountIdDropdown, boardIdDropdown, boardSectionIdDropdown, pinIdMultiSelectDropdown } from '../common/props';

export const createPin = createAction({
  auth: pinterestAuth,
  name: 'createPin',
  displayName: 'Create Pin',
  description: 'Upload an image or video to create a new Pin on a board.',
  props: {
    ad_account_id: adAccountIdDropdown,
    board_id: boardIdDropdown,
    board_section_id: boardSectionIdDropdown,
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
    }),
    dominant_color: Property.ShortText({
      displayName: "Pin Color",
      description: 'Dominant pin color. Hex number, e.g. "#6E7874".',
      required: false
    }),
    alt_text: Property.ShortText({
      displayName: "alt_text",
      description: '',
      required: false
    }),
    parent_pin_id: Property.ShortText({
      displayName: 'Parent Pin Id',
      description: 'The source pin id if this pin was saved from another pin.',
      required: false,
    }),
    sponsor_id: Property.ShortText({
      displayName: 'Sponsor Id',
      description: 'The sponsor account id to request paid partnership from. Currently the field is only available to a list of users in a closed beta.',
      required: false,
    }),
    product_tags: pinIdMultiSelectDropdown,
    note: Property.ShortText({
      displayName: 'Note',
      description: 'Private note for this Pin.',
      required: false,
    }),
    is_removable: Property.Checkbox({
      displayName: 'Is Removable',
      description: 'Used to create ad-only Pins. A value of true indicates an ad-only Pin.',
      required: false,
      defaultValue: false,
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
    return await makeRequest(auth.access_token as string, HttpMethod.POST, '/pins', body);
  },
});
