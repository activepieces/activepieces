import { medullarAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getUser, medullarCommon, medullarPropsCommon } from '../common';

export const addSpaceRecord = createAction({
  auth: medullarAuth,
  name: 'addSpaceRecord',
  displayName: 'Add Space Record',
  description: 'Adds a Record into a Space',
  props: {
    spaceId: medullarPropsCommon.spaceId,
    sourceType: Property.StaticDropdown({
      displayName: 'Source Type',
      description: 'Select source type',
      required: true,
      options: {
        options: [
          {
            label: 'URL',
            value: 'url',
          },
          {
            label: 'Text',
            value: 'text',
          },
          {
            label: 'Image',
            value: 'image',
          },
          {
            label: 'File',
            value: 'file',
          },
        ],
      },
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Optional. Content of the record',
      required: false,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Optional. URL of the record',
      required: false,
    }),
  },
  async run(context) {
    const userData = await getUser(context.auth);

    let url = ' ';
    let content = ' ';
    if (context.propsValue['url'] != null) url = context.propsValue['url'];
    if (context.propsValue['content'] != null)
      content = context.propsValue['content'];

    const spaceResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${medullarCommon.exploratorUrl}/records/`,
      body: {
        spaces: [
          {
            uuid: context.propsValue['spaceId'],
          },
        ],
        company: {
          uuid: userData.company.uuid,
        },
        user: {
          uuid: userData.uuid,
        },
        source: context.propsValue['sourceType'],
        data: {
          content: content,
          url: url,
        },
      },
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
    });

    return spaceResponse.body;
  },
});
