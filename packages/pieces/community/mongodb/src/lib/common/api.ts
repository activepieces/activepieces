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
  const beforeDocument = await collection.findOne(filter);

  const replaceResult = await collection.replaceOne(filter, replacement, {
    upsert,
  });

  let afterDocument = null;
  if (
    returnDocumentPreference === 'after' ||
    (!beforeDocument && replaceResult.matchedCount > 0)
  ) {
    const replacedId = replaceResult.upsertedId ?? beforeDocument?._id;
    afterDocument = await collection.findOne(
      replacedId === undefined ? filter : { _id: replacedId },
    );
  }

  const document =
    returnDocumentPreference === 'before' ? beforeDocument : afterDocument;

  return {
    matchedCount: replaceResult.matchedCount,
    modifiedCount: replaceResult.modifiedCount,
    upsertedId: replaceResult.upsertedId,
    document,
  };
}

export const mongodbApi = { findAndUpdateDocuments, findAndReplaceDocument };
