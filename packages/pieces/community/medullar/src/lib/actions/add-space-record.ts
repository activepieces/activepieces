import { medullarAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getUser, medullarCommon, medullarPropsCommon } from '../common';

export const addSpaceRecord = createAction({
  auth: medullarAuth,
  name: 'addSpaceRecord',
  displayName: 'Add Space Record',
  description: 'Adds a Record into a Space',
  audience: 'both',
  aiMetadata: { description: 'Ingests a new content record into a Medullar Space identified by its UUID, so the content becomes part of that Space\'s knowledge base. The source type selects what kind of content is added (url, text, image, or file), with content and/or url supplied accordingly. Use to feed material into a Space before asking questions about it. Not idempotent: each call appends a new record.', idempotent: false },
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
      url: `${medullarCommon.aiUrl}/records/`,
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
        Authorization: `Bearer ${context.auth.secret_text}`,
      },
    });

    return spaceResponse.body;
  },
});
