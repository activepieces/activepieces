import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { thanksterAuth } from '../..';

export const sendCards = createAction({
  name: 'send_handwritten_cards',
  displayName: 'Send Cards',
  description: 'Automatically send handwritten cards.',
  auth: thanksterAuth,
  props: {
    templateID: Property.Dropdown({
      displayName: 'Select a Thankster Template',
      description: 'If you are passing text or images from prior steps in this step into the Thankster template chosen above, be sure to select a template that has corresponding text or images boxes to pass it into. Either way, the font and style of your cards will be taken from the template you select.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please fill in API key first',
          };
        }

        const res = await httpClient.sendRequest<{ id: number; name: string }[]>({
          method: HttpMethod.GET,
          url: 'https://app.thankster.com/api/v1/api_projects/listUserProjects',
          headers: {
            partner: 'partner_active_pieces',
            userApiKey: auth as string
          },
        });

        const opts = [];

        if (res.body) {
          for(const template of res.body) {
            opts.push({
              label: template.name,
              value: template.id
            })
          }
        }
        
        return {
          disabled: false,
          options: opts
        };
      },
    }),
    fname: Property.ShortText({
      displayName: 'Sender Firstname',
      description: 'Sender first name.',
      required: true
    }),
    lname: Property.ShortText({
      displayName: 'Sender Lastname',
      description: 'Sender last name.',
      required: false
    }),
    company: Property.ShortText({
      displayName: 'Sender Company Name',
      description: 'Enter sender company name.',
      required: false
    }),
    address: Property.ShortText({
      displayName: 'Sender Address1',
      description: 'Enter sender address1.',
      required: true
    }),
    address2: Property.ShortText({
      displayName: 'Sender Address2',
      description: 'Enter sender address2.',
      required: false
    }),
    city: Property.ShortText({
      displayName: 'Sender City',
      description: 'Enter sender city.',
      required: true
    }),
    state: Property.ShortText({
      displayName: 'Sender State',
      description: 'Enter sender state.',
      required: false
    }),
    zip: Property.ShortText({
      displayName: 'Sender Zip',
      description: 'Enter sender zip.',
      required: true
    }),
    country: Property.ShortText({
      displayName: 'Sender Country',
      description: 'If not US, type the two character country code.',
      defaultValue: 'US',
      required: false
    }),
    r_fname: Property.ShortText({
      displayName: 'Receiver Firstname',
      description: 'Receiver first name.',
      required: true
    }),
    r_lname: Property.ShortText({
      displayName: 'Receiver Lastname',
      description: 'Receiver last name.',
      required: false
    }),
    r_company: Property.ShortText({
      displayName: 'Receiver Company',
      description: 'Receiver company name.',
      required: false
    }),
    r_address: Property.ShortText({
      displayName: 'Receiver Address1',
      description: 'Receiver address1.',
      required: true
    }),
    r_address2: Property.ShortText({
      displayName: 'Receiver Address2',
      description: 'Receiver address2.',
      required: false
    }),
    r_city: Property.ShortText({
      displayName: 'Receiver City',
      description: 'Receiver city.',
      required: true
    }),
    r_state: Property.ShortText({
      displayName: 'Receiver State',
      description: 'Receiver state.',
      required: false
    }),
    r_zip: Property.ShortText({
      displayName: 'Receiver Zip',
      description: 'Receiver zip.',
      required: true
    }),
    r_country: Property.ShortText({
      displayName: 'Receiver Country',
      description: 'If not US, type the two character country code.',
      defaultValue: 'US',
      required: false
    }),
    api_text_one: Property.LongText({
      displayName: 'Text One',
      description: 'Optional - if left blank, it will take the message from your Thankster template. Otherwise, map this to an api text box in the Thankster template being in Thankster Template field, 200 character maximum suggested.',
      required: false
    }),
    api_text_two: Property.LongText({
      displayName: 'Text Two',
      description: 'Optional - if left blank, it will take the message from your Thankster template. Otherwise, map this to an api text box in the Thankster template being in Thankster Template field, 200 character maximum suggested.',
      required: false
    }),
    api_text_three: Property.LongText({
      displayName: 'Text Three',
      description: 'Optional - if left blank, it will take the message from your Thankster template. Otherwise, map this to an api text box in the Thankster template being in Thankster Template field, 200 character maximum suggested.',
      required: false
    }),
    api_text_four: Property.LongText({
      displayName: 'Text Four',
      description: 'Optional - if left blank, it will take the message from your Thankster template. Otherwise, map this to an api text box in the Thankster template being in Thankster Template field, 200 character maximum suggested.',
      required: false
    }),
    api_image_one: Property.ShortText({
      displayName: 'Image One (URL)',
      description: 'Optional image URL for image one. Be sure this image is at least 1500 x 1900 pixels and has that aspect ratio to avoid stretching or pixelated.',
      required: false
    }),
    api_image_two: Property.ShortText({
      displayName: 'Image Two (URL)',
      description: 'Optional image URL for image one. Be sure this image is at least 1500 x 1900 pixels and has that aspect ratio to avoid stretching or pixelated.',
      required: false
    }),
    api_image_three: Property.ShortText({
      displayName: 'Image Three (URL)',
      description: 'Optional image URL for image one. Be sure this image is at least 1500 x 1900 pixels and has that aspect ratio to avoid stretching or pixelated.',
      required: false
    }),
    api_image_four: Property.ShortText({
      displayName: 'Image Four (URL)',
      description: 'Optional image URL for image one. Be sure this image is at least 1500 x 1900 pixels and has that aspect ratio to avoid stretching or pixelated.',
      required: false
    }),
    sender_image: Property.ShortText({
      displayName: 'Sender Image',
      description: 'Optional image URL for return address (on the envelope). The recommended image size is 300x120 pixels or that aspect ratio to avoid stretching or pixelation. The image will be on top of the text and it will be downsized preserving the aspect ratio to fit the boundaries if necessary.',
      required: false
    }),
    recipient_image: Property.ShortText({
      displayName: 'Recipient Image',
      description: 'Optional image URL for return address (on the envelope). The recommended image size is 300x120 pixels or that aspect ratio to avoid stretching or pixelation. The image will be on top of the text and it will be downsized preserving the aspect ratio to fit the boundaries if necessary.',
      required: false
    })
 },
  async run(context) {
    const res = await httpClient.sendRequest<{status: number, message: string}>({
      method: HttpMethod.POST,
      url: 'https://app.thankster.com/api/v1/api_projects/createQuickProject',
      headers: {
        partner: 'partner_active_pieces',
        userApiKey: context.auth as string
      },
      body: {
        templateID: context.propsValue.templateID,
        fname: context.propsValue.fname,
        lname: context.propsValue.lname,
        company: context.propsValue.company,
        address: context.propsValue.address,
        address2: context.propsValue.address2,
        city: context.propsValue.city,
        state: context.propsValue.state,
        zip: context.propsValue.zip,
        country: context.propsValue.country,
        r_fname: context.propsValue.r_fname,
        r_lname: context.propsValue.r_lname,
        r_address: context.propsValue.r_address,
        r_address2: context.propsValue.r_address2,
        r_city: context.propsValue.r_city,
        r_state: context.propsValue.r_state,
        r_zip: context.propsValue.r_zip,
        r_country: context.propsValue.r_country,
        api_text_one: context.propsValue.api_text_one,
        api_text_two: context.propsValue.api_text_two,
        api_text_three: context.propsValue.api_text_three,
        api_text_four: context.propsValue.api_text_four,
        api_image_one: context.propsValue.api_image_one,
        api_image_two: context.propsValue.api_image_two,
        api_image_three: context.propsValue.api_image_three,
        api_image_four: context.propsValue.api_image_four,
        sender_image: context.propsValue.sender_image,
        recipient_image: context.propsValue.recipient_image
      }
    });
    return res.body;
  },
});
