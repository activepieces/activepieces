import { Property, createAction } from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys, makeClient } from '../../common';

export const ContentfulGetRecordAction = createAction({
  name: 'contentful_record_get',
  auth: ContentfulAuth,
  displayName: 'Get Record',
  description: 'Gets a Contentful record for a given Content Model',
  audience: 'both',
  aiMetadata: { description: 'Fetches a single Contentful entry by its entry ID. Use when you already know the exact record ID and need its full data; for finding records by criteria use Search Records instead. Read-only and idempotent.', idempotent: true },
  props: {
    [PropertyKeys.ENTITY_ID]: Property.ShortText({
      displayName: 'Entity ID',
      required: true,
      description: 'The ID of the record to get.',
    }),
  },
  async run({ auth, propsValue }) {
    const { client } = makeClient(auth);
    return await client.entry.get({
      entryId: propsValue[PropertyKeys.ENTITY_ID] as string,
    });
  },
});
