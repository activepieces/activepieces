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

  const outcomes = await updateEachById({ collection, filter, update, ids: matchedIds });
  const updated = outcomes.filter((outcome) => outcome.matched);

  return {
    matchedCount: updated.length,
    modifiedCount: updated.reduce((total, outcome) => total + outcome.modifiedCount, 0),
    upsertedCount: 0,
    upsertedId: null,
    documents: updated.flatMap((outcome) => (outcome.document === null ? [] : [outcome.document])),
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
}): Promise<UpdateOutcome[]> {
  const outcomes: UpdateOutcome[] = [];
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const batch = ids.slice(start, start + ID_BATCH_SIZE);
    const batchOutcomes = await Promise.all(
      batch.map((id) => updateOneById({ collection, filter, update, id })),
    );
    outcomes.push(...batchOutcomes);
  }
  return outcomes;
}

async function updateOneById({
  collection,
  filter,
  update,
  id,
}: {
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  id: WithId<Document>['_id'];
}): Promise<UpdateOutcome> {
  const result = await collection.updateOne({ $and: [filter, { _id: id }] }, update);
  if (result.matchedCount === 0) {
    return { matched: false, modifiedCount: 0, document: null };
  }
  const document = await collection.findOne({ _id: id });
  return { matched: true, modifiedCount: result.modifiedCount, document };
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

const ID_BATCH_SIZE = 50;

type UpdateOutcome = {
  matched: boolean;
  modifiedCount: number;
  document: Document | null;
};
