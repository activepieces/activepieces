import { MongoServerError } from 'mongodb';
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

  const mode = await chooseUpdateMode({ client, collection });
  const batchResult = await updateEachById({
    client,
    collection,
    filter,
    update,
    ids: matchedIds,
    mode,
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
  mode,
}: {
  client: MongoClient;
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  ids: WithId<Document>['_id'][];
  mode: UpdateMode;
}): Promise<BatchResult> {
  let currentMode = mode;
  let matchedCount = 0;
  let modifiedCount = 0;
  const documents: Document[] = [];
  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const batch = ids.slice(start, start + ID_BATCH_SIZE);
    const transactionResult =
      currentMode === 'transaction'
        ? await tryBatchInTransaction({ client, collection, filter, update, batch })
        : null;
    if (currentMode === 'transaction' && transactionResult === null) {
      currentMode = 'per-document';
    }
    const batchResult =
      transactionResult ?? (await updateBatchPerDocument({ collection, filter, update, batch }));
    matchedCount += batchResult.matchedCount;
    modifiedCount += batchResult.modifiedCount;
    documents.push(...batchResult.documents);
  }
  return { matchedCount, modifiedCount, documents };
}

async function tryBatchInTransaction({
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
}): Promise<BatchResult | null> {
  const session = client.startSession();
  try {
    return await session.withTransaction((activeSession) =>
      updateBatch({ collection, filter, update, batch, session: activeSession }),
    );
  } catch (error) {
    if (isTransactionUnsupported({ error })) {
      return null;
    }
    throw error;
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
  session: ClientSession;
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

async function updateBatchPerDocument({
  collection,
  filter,
  update,
  batch,
}: {
  collection: Collection<Document>;
  filter: Document;
  update: Document;
  batch: WithId<Document>['_id'][];
}): Promise<BatchResult> {
  let matchedCount = 0;
  let modifiedCount = 0;
  const documents: Document[] = [];
  for (let start = 0; start < batch.length; start += PER_DOCUMENT_CONCURRENCY) {
    const slice = batch.slice(start, start + PER_DOCUMENT_CONCURRENCY);
    const outcomes = await Promise.all(
      slice.map((id) => updateOneById({ collection, filter, update, id })),
    );
    for (const outcome of outcomes) {
      if (outcome.matched) {
        matchedCount += 1;
        modifiedCount += outcome.modifiedCount;
        if (outcome.document !== null) {
          documents.push(outcome.document);
        }
      }
    }
  }
  return { matchedCount, modifiedCount, documents };
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
}): Promise<DocumentOutcome> {
  const result = await collection.updateOne({ $and: [filter, { _id: id }] }, update);
  if (result.matchedCount === 0) {
    return { matched: false, modifiedCount: 0, document: null };
  }
  const document = await collection.findOne({ _id: id });
  return { matched: true, modifiedCount: result.modifiedCount, document };
}

async function chooseUpdateMode({
  client,
  collection,
}: {
  client: MongoClient;
  collection: Collection<Document>;
}): Promise<UpdateMode> {
  const hello = await client.db('admin').command({ hello: 1 });
  const replicated = typeof hello['setName'] === 'string' || hello['msg'] === 'isdbgrid';
  if (!replicated) {
    return 'per-document';
  }
  const info = await client
    .db(collection.dbName)
    .listCollections({ name: collection.collectionName }, { nameOnly: false })
    .next();
  const plainCollection =
    info !== null && info.type === 'collection' && info.options?.['capped'] !== true;
  return plainCollection ? 'transaction' : 'per-document';
}

function isTransactionUnsupported({ error }: { error: unknown }): boolean {
  return error instanceof MongoServerError && (error.code === 20 || error.code === 263);
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

const PER_DOCUMENT_CONCURRENCY = 50;

type BatchResult = {
  matchedCount: number;
  modifiedCount: number;
  documents: Document[];
};

type UpdateMode = 'transaction' | 'per-document';

type DocumentOutcome = {
  matched: boolean;
  modifiedCount: number;
  document: Document | null;
};
