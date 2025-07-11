import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pinterestAuth } from '../common/auth';

export const createPinAction = createAction({
  name: 'create_pin',
  displayName: 'Create Pin',
  description: 'Create a Pin on a board.',
  auth: pinterestAuth,
  props: {
    title: Property.ShortText({ displayName: 'Title', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    link: Property.ShortText({ displayName: 'Destination Link', required: false }),
    dominant_color: Property.ShortText({ displayName: 'Dominant Color (Hex)', required: false }),
    alt_text: Property.LongText({ displayName: 'Alt Text', required: false }),
    board_id: Property.ShortText({ displayName: 'Board ID', required: true }),
    board_section_id: Property.ShortText({ displayName: 'Board Section ID', required: false }),

    // Select media source type
    media_source_type: Property.StaticDropdown({
      displayName: 'Media Source Type',
      required: true,
      options: {
        options: [
          { label: 'Single Image URL', value: 'image_url' },
          { label: 'Single Image Base64', value: 'image_base64' },
          { label: 'Multiple Image URLs', value: 'multiple_image_urls' },
          { label: 'Multiple Image Base64', value: 'multiple_image_base64' },
          { label: 'Video ID', value: 'video_id' },
          { label: 'Pin URL (for Product Pin)', value: 'pin_url' },
        ],
      },
    }),

    // Common fields
    image_url: Property.ShortText({ displayName: 'Image URL', required: false }),
    image_base64: Property.File({ displayName: 'Image File (Base64)', required: false }),
    is_standard: Property.Checkbox({ displayName: 'Is Standard?', defaultValue: true, required: false }),

    // Multiple Images
    multiple_image_data: Property.Json({ displayName: 'Multiple Image Data (array of {title, description, link, url|base64,data})', required: false }),

    // Video
    video_id: Property.ShortText({ displayName: 'Video ID', required: false }),
    cover_image_url: Property.ShortText({ displayName: 'Cover Image URL', required: false }),
    cover_image_content_type: Property.StaticDropdown({
      displayName: 'Cover Image Content-Type',
      required: false,
      options: {
        options: [
          { label: 'image/jpeg', value: 'image/jpeg' },
          { label: 'image/png', value: 'image/png' },
        ],
      },
    }),
    cover_image_data: Property.File({ displayName: 'Cover Image File (Base64)', required: false }),
    cover_image_key_frame_time: Property.Number({ displayName: 'Cover Image Key Frame Time (in seconds)', required: false }),

    // Product Pin
    pin_url: Property.ShortText({ displayName: 'Pin URL', required: false }),
    is_affiliate_link: Property.Checkbox({ displayName: 'Is Affiliate Link?', required: false }),
    parent_pin_id: Property.ShortText({ displayName: 'Parent Pin ID', required: false }),
    note: Property.LongText({ displayName: 'Private Note', required: false }),
    product_tags: Property.Json({ displayName: 'Product Tags (Array of {pin_id})', required: false }),
    sponsor_id: Property.ShortText({ displayName: 'Sponsor ID', required: false }),
    is_removable: Property.Checkbox({ displayName: 'Is Removable (Ad-only)?', required: false }),
  },
  async run(context) {
    const {
      media_source_type,
      board_id,
      title,
      description,
      link,
      dominant_color,
      alt_text,
      board_section_id,
      image_url,
      image_base64,
      is_standard,
      multiple_image_data,
      video_id,
      cover_image_url,
      cover_image_content_type,
      cover_image_data,
      cover_image_key_frame_time,
      pin_url,
      is_affiliate_link,
      parent_pin_id,
      note,
      product_tags,
      sponsor_id,
      is_removable,
    } = context.propsValue;

    const media_source: any = { source_type: media_source_type };

    switch (media_source_type) {
      case 'image_url':
        media_source.url = image_url;
        if (is_standard !== undefined) media_source.is_standard = is_standard;
        break;

      case 'image_base64':
        if (!image_base64) throw new Error('Image base64 file is required.');
        media_source.content_type = image_base64['mime_type'];
        media_source.data = image_base64.base64;
        if (is_standard !== undefined) media_source.is_standard = is_standard;
        break;

      case 'multiple_image_urls':
        if (!multiple_image_data) throw new Error('Multiple image data is required.');
        media_source.items = multiple_image_data;
        break;

      case 'multiple_image_base64':
        if (!multiple_image_data) throw new Error('Multiple image data is required.');
        media_source.items = multiple_image_data;
        break;

      case 'video_id':
        if (!video_id) throw new Error('Video ID is required.');
        media_source.video_id = video_id;
        if (cover_image_url) media_source.cover_image_url = cover_image_url;
        if (cover_image_content_type) media_source.cover_image_content_type = cover_image_content_type;
        if (cover_image_data) media_source.cover_image_data = cover_image_data.base64;
        if (cover_image_key_frame_time !== undefined)
          media_source.cover_image_key_frame_time = cover_image_key_frame_time;
        if (is_standard !== undefined) media_source.is_standard = is_standard;
        break;

      case 'pin_url':
        if (!pin_url) throw new Error('Pin URL is required.');
        media_source.pin_url = pin_url;
        if (is_affiliate_link !== undefined) media_source.is_affiliate_link = is_affiliate_link;
        if (parent_pin_id) media_source.parent_pin_id = parent_pin_id;
        if (note) media_source.note = note;
        if (product_tags) media_source.product_tags = product_tags;
        if (sponsor_id) media_source.sponsor_id = sponsor_id;
        if (is_removable !== undefined) media_source.is_removable = is_removable;
        break;

      default:
        throw new Error(`Unsupported media_source_type: ${media_source_type}`);
    }

    const body: any = {
      board_id,
      media_source,
    };

    if (title) body.title = title;
    if (description) body.description = description;
    if (link) body.link = link;
    if (dominant_color) body.dominant_color = dominant_color;
    if (alt_text) body.alt_text = alt_text;
    if (board_section_id) body.board_section_id = board_section_id;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.pinterest.com/v5/pins',
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      return response.body;
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${JSON.stringify(msg)}`);
        case 401:
          throw new Error('Unauthorized: Invalid or expired access token.');
        case 403:
          throw new Error('Forbidden: Access denied. Check scopes or board ownership.');
        case 404:
          throw new Error('Not Found: Board or resource not found.');
        case 429:
          throw new Error('Rate Limit Exceeded: Please try again later.');
        case 500:
        case 502:
        case 503:
        case 504:
          throw new Error('Server Error: Pinterest API unavailable. Try again later.');
        default:
          throw new Error(`Unexpected Error (${status}): ${JSON.stringify(msg)}`);
      }
    }
  },
});
