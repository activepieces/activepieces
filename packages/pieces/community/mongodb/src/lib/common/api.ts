import type { ClientSession, Collection, Document, MongoClient, WithId } from 'mongodb';

async function findAndUpdateDocuments({
  client,
  collection,
  filter,
  update,
  upsert,
  returnUpdated,
}: {
  client: MongoClient;
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  upsert: boolean;
  returnUpdated: boolean;
}) {
  if (!returnUpdated) {
    const updateResult = await collection.updateMany(filter, update, { upsert });
    return {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      upsertedCount: updateResult.upsertedCount,
      upsertedId: updateResult.upsertedId,
      documents: undefined,
    };
  }

  const matchedIds = (
    await collection.find(filter, { projection: { _id: 1 } }).toArray()
  ).map((document) => document._id);

  if (matchedIds.length === 0) {
    const upsertResult = await collection.updateOne(filter, update, { upsert });
    const upsertedId = upsertResult.upsertedId;
    const upsertedDocument =
      upsertedId === null || upsertedId === undefined
        ? null
        : await collection.findOne({ _id: upsertedId });
    return {
      matchedCount: upsertResult.matchedCount,
      modifiedCount: upsertResult.modifiedCount,
      upsertedCount: upsertResult.upsertedCount,
      upsertedId,
      documents: upsertedDocument === null ? [] : [upsertedDocument],
    };
  }

  const transactional = await supportsTransactions({ client });
  const batchResult = await updateEachById({
    client,
    collection,
    filter,
    update,
    ids: matchedIds,
    transactional,
  });
  return {
    matchedCount: batchResult.matchedCount,
    modifiedCount: batchResult.modifiedCount,
    upsertedCount: 0,
    upsertedId: null,
    documents: batchResult.documents,
  };
}

async function updateEachById({
  client,
  collection,
  filter,
  update,
  ids,
  transactional,
}: {
  client: MongoClient;
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  ids: WithId<Document>['_id'][];
  transactional: boolean;
}): Promise<BatchResult> {
  let matchedCount = 0;
  let modifiedCount = 0;
  const documents: Document[] = [];
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const batch = ids.slice(start, start + ID_BATCH_SIZE);
    const batchResult = transactional
      ? await runBatchInTransaction({ client, collection, filter, update, batch })
      : await updateBatch({ collection, filter, update, batch, session: undefined });
    matchedCount += batchResult.matchedCount;
    modifiedCount += batchResult.modifiedCount;
    documents.push(...batchResult.documents);
  }
  return { matchedCount, modifiedCount, documents };
}

async function runBatchInTransaction({
  client,
  collection,
  filter,
  update,
  batch,
}: {
  client: MongoClient;
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  batch: WithId<Document>['_id'][];
}): Promise<BatchResult> {
  const session = client.startSession();
  try {
    return await session.withTransaction((activeSession) =>
      updateBatch({ collection, filter, update, batch, session: activeSession }),
    );
  } finally {
    await session.endSession();
  }
}

async function updateBatch({
  collection,
  filter,
  update,
  batch,
  session,
}: {
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  batch: WithId<Document>['_id'][];
  session: ClientSession | undefined;
}): Promise<BatchResult> {
  const stillMatching = (
    await collection
      .find({ $and: [filter, { _id: { $in: batch } }] }, { projection: { _id: 1 }, session })
      .toArray()
  ).map((document) => document._id);
  if (stillMatching.length === 0) {
    return { matchedCount: 0, modifiedCount: 0, documents: [] };
  }
  const result = await collection.updateMany(
    { $and: [filter, { _id: { $in: stillMatching } }] },
    update,
    { session },
  );
  const documents = await collection.find({ _id: { $in: stillMatching } }, { session }).toArray();
  return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, documents };
}

async function supportsTransactions({ client }: { client: MongoClient }): Promise<boolean> {
  const hello = await client.db('admin').command({ hello: 1 });
  return typeof hello['setName'] === 'string' || hello['msg'] === 'isdbgrid';
}

async function findAndReplaceDocument({
  collection,
  filter,
  replacement,
  upsert,
  returnDocumentPreference,
}: {
  collection: Collection<Document>;
  filter: Document;
  replacement: Document;
  upsert: boolean;
  returnDocumentPreference: string;
}) {
  const result = await collection.findOneAndReplace(filter, replacement, {
    upsert,
    returnDocument: returnDocumentPreference === 'before' ? 'before' : 'after',
    includeResultMetadata: true,
  });

  const matchedCount = result.lastErrorObject?.['updatedExisting'] ? 1 : 0;

  return {
    matchedCount,
    modifiedCount: matchedCount,
    upsertedId: result.lastErrorObject?.['upserted'] ?? null,
    document: result.value,
  };
}

export const mongodbApi = { findAndUpdateDocuments, findAndReplaceDocument };

const ID_BATCH_SIZE = 500;

type BatchResult = {
  matchedCount: number;
  modifiedCount: number;
  documents: Document[];
};
