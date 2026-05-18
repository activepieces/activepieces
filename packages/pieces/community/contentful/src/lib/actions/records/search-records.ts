import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys, makeClient } from '../../common';
import { ContentfulProperty } from '../../properties';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const ContentfulSearchRecordsAction = createAction({
  name: 'contentful_record_search',
  auth: ContentfulAuth,
  displayName: 'Search Records',
  description: 'Searches for records of a given Content Model',
  props: {
    [PropertyKeys.CONTENT_MODEL]: ContentfulProperty.ContentModel,
    [PropertyKeys.LOCALE]: ContentfulProperty.Locale,
    [PropertyKeys.QUERY]: Property.Json({
      required: true,
      defaultValue: {},
      displayName: 'Query Formula',
      description:
        'The query formula to use to search for records. See https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/search-parameters for more information',
    }),
    [PropertyKeys.QUERY_LIMIT]: Property.Number({
      displayName: 'Limit',
      description: 'The maximum number of records to return',
      required: false,
      defaultValue: 10,
    }),
    [PropertyKeys.QUERY_SKIP]: Property.Number({
      displayName: 'Skip',
      description: 'The number of records to skip',
      required: false,
      defaultValue: 0,
    }),
    [PropertyKeys.QUERY_INCLUDE]: Property.Number({
      displayName: 'Relationship Include Depth',
      description:
        'Number of levels to include for entries and assets. See https://www.contentful.com/developers/docs/references/content-delivery-api/#/reference/resource-links/retrieval-of-linked-resource-links',
      defaultValue: 1,
      required: false,
    }),
    [PropertyKeys.QUERY_SELECT]: ContentfulProperty.SelectFields,
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      [PropertyKeys.QUERY_INCLUDE]: z.number().min(1),
    });

    const { client } = makeClient(auth);
    const select =
      (propsValue[PropertyKeys.QUERY_SELECT] as string[]) || undefined;
    return client.entry.getMany({
      query: {
        ...(propsValue[PropertyKeys.QUERY] as any),
        limit: (propsValue[PropertyKeys.QUERY_LIMIT] as number) || 10,
        skip: (propsValue[PropertyKeys.QUERY_SKIP] as number) || 0,
        content_type: propsValue[PropertyKeys.CONTENT_MODEL] as string,
        include: (propsValue[PropertyKeys.QUERY_INCLUDE] as number) || 1,
        select: select?.join(','),
      },
    });
  },
});
