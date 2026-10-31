import { createAction, Property } from '@activepieces/pieces-framework';
import { BSON } from 'mongodb';
import type { Document } from 'mongodb';
import { mongodbAuth } from '../../auth';
import { mongodbAiProps } from '../../common/ai-props';
import { mongodbClient } from '../../common/client';
import { mongodbUtils } from '../../common/utils';

export const distinctValuesAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_distinct_values',
  displayName: 'Get Distinct Values',
  description: 'Get the distinct values of a field across matching documents.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns the unique values of one field across the documents that match a filter; array fields contribute each element. Use it to discover categories, statuses or other enumerations in a collection. Returns at most the limit (default 100, max 1000).',
    idempotent: true,
  },
  props: {
    database: mongodbAiProps.database({ required: false }),
    collection: mongodbAiProps.collection({ required: true }),
    field: Property.ShortText({
      displayName: 'Field',
      description: 'Field path to read, e.g. "status" or "address.city".',
      required: true,
    }),
    filter: mongodbAiProps.filter({ required: false }),
    limit: mongodbAiProps.limit({ required: false }),
  },
  async run(context) {
    const { field } = context.propsValue;
    const filter: Document = BSON.EJSON.deserialize(context.propsValue.filter ?? {});
    const databaseName = mongodbUtils.databaseName({ auth: context.auth, database: context.propsValue.database });
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      const groups = await client
        .db(databaseName)
        .collection(context.propsValue.collection)
        .aggregate([
          { $match: filter },
          { $unwind: `$${field}` },
          { $group: { _id: `$${field}` } },
          { $sort: { _id: 1 } },
          { $limit: mongodbUtils.limit({ value: context.propsValue.limit }) },
        ])
        .toArray();
      const values = groups.map((group) => group['_id']);
      return { values, count: values.length };
    } finally {
      await client.close();
    }
  },
});
