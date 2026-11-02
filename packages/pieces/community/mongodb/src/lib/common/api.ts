import type { Collection, Document, WithId } from 'mongodb';

async function findAndUpdateDocuments({
  collection,
  filter,
  update,
  upsert,
  returnUpdated,
}: {
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

  const batchResult = await updateEachById({ collection, filter, update, ids: matchedIds });
  return {
    matchedCount: batchResult.matchedCount,
    modifiedCount: batchResult.modifiedCount,
    upsertedCount: 0,
    upsertedId: null,
    documents: batchResult.documents,
  };
}

async function updateEachById({
  collection,
  filter,
  update,
  ids,
}: {
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  ids: WithId<Document>['_id'][];
}): Promise<BatchResult> {
  let matchedCount = 0;
  let modifiedCount = 0;
  const documents: Document[] = [];
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const batch = ids.slice(start, start + ID_BATCH_SIZE);
    const result = await collection.updateMany(
      { $and: [filter, { _id: { $in: batch } }] },
      update,
    );
    matchedCount += result.matchedCount;
    modifiedCount += result.modifiedCount;
    const batchDocuments = await collection.find({ _id: { $in: batch } }).toArray();
    documents.push(...batchDocuments);
  }
  return { matchedCount, modifiedCount, documents };
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
