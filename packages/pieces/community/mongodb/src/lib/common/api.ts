import type { Collection, Document } from 'mongodb';

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
  const updateResult = await collection.updateMany(filter, update, { upsert });

  let documents: Record<string, unknown>[] = [];
  if (returnUpdated) {
    documents = await collection.find(filter).toArray();
  }

  return {
    matchedCount: updateResult.matchedCount,
    modifiedCount: updateResult.modifiedCount,
    upsertedCount: updateResult.upsertedCount,
    upsertedId: updateResult.upsertedId,
    documents: returnUpdated ? documents : undefined,
  };
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
