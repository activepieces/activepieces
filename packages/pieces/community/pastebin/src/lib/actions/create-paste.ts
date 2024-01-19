import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, pastebinCommon } from '../common';
import { PasteExpiry, PastePrivacy } from '../common/client';
import { pastebinAuth } from '../..';

export default createAction({
  auth: pastebinAuth,
  name: 'create_paste',
  displayName: 'Create Paste',
  description: 'Creates a new paste',
  props: {
    content: Property.LongText({
      displayName: 'Content',
      required: true,
    }),
    format: pastebinCommon.paste_format(false),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      options: {
        options: [
          { label: 'Public', value: PastePrivacy.PUBLIC },
          { label: 'Unlisted', value: PastePrivacy.UNLISTED },
          { label: 'Private', value: PastePrivacy.PRIVATE },
        ],
      },
    }),
    expiry: Property.StaticDropdown({
      displayName: 'Expiry',
      required: false,
      options: {
        options: [
          { label: 'Never', value: PasteExpiry.NEVER },
          { label: '10 Minutes', value: PasteExpiry.TEN_MINUTES },
          { label: '1 Hour', value: PasteExpiry.ONE_HOUR },
          { label: '1 Day', value: PasteExpiry.ONE_DAY },
          { label: '1 Week', value: PasteExpiry.ONE_WEEK },
          { label: '2 Weeks', value: PasteExpiry.TWO_WEEKS },
          { label: '1 Month', value: PasteExpiry.ONE_MONTH },
          { label: '6 Months', value: PasteExpiry.SIX_MONTHS },
          { label: '1 Year', value: PasteExpiry.ONE_YEAR },
        ],
      },
    }),
    folder: Property.ShortText({
      displayName: 'Folder',
      required: false,
    }),
  },
  async run(context) {
    const client = await makeClient(context.auth);
    const url = await client.createPaste({
      paste_code: context.propsValue.content,
      paste_format: context.propsValue.format,
      paste_name: context.propsValue.name,
      paste_private: context.propsValue.privacy,
      paste_expiry_date: context.propsValue.expiry,
      folder_key: context.propsValue.folder,
    });
    const id = url.split('/').reduce((c, v) => v);
    return {
      id,
      url,
    };
  },
});
