import { test } from 'vitest';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { invoke, ndjson, withServer } from './wire.mjs';

const spaceId = randomUUID();
const memoryId = randomUUID();
const embedderId = randomUUID();
const rawId = randomUUID();
const finalId = randomUUID();
const memory = {
  memoryId,
  spaceId,
  contentType: 'text/plain',
  processingStatus: 'COMPLETED',
  metadata: {},
};
const first = { chunkId: randomUUID(), memoryId, chunkText: 'First passage' };
const second = { chunkId: randomUUID(), memoryId, chunkText: 'Second passage' };
const query = {
  query: 'Relevant passages',
  spaceIds: [spaceId],
  maxResults: 2,
};

function stage({ id, chunks, score = -0.9 }) {
  return [
    {
      resultSetBoundary: { resultSetId: id, kind: 'BEGIN', stageName: 'test' },
    },
    ...chunks.map((chunk) => ({
      retrievedItem: {
        chunk: {
          chunk,
          resultSetId: id,
          relevanceScore: score,
          memoryIndex: 0,
        },
      },
    })),
    { resultSetBoundary: { resultSetId: id, kind: 'END', stageName: 'test' } },
  ];
}

test('an unfinished result set preserves usable chunks with an explicit incomplete status', async () => {
  await withServer({
    handler: () => ndjson(stage({ id: rawId, chunks: [first] }).slice(0, -1)),
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'retrieve_memories',
        props: query,
        auth,
      });
      assert.equal(result.partial, true);
      assert.equal(result.resultSetId, rawId);
      assert.deepEqual(
        result.results.map((result) => result.chunkId),
        [first.chunkId]
      );
      assert.equal(result.statuses[0].code, 'INCOMPLETE_RESULT_SET');
      assert.equal(result.statuses[0].origin, 'client');
      assert.equal(result.statuses[0].details.result_set_id, rawId);
    },
  });
});

test('an unfinished empty set fails instead of claiming a complete empty search', async () => {
  await withServer({
    handler: () => ndjson(stage({ id: rawId, chunks: [] }).slice(0, -1)),
    exercise: async ({ auth }) => {
      await assert.rejects(
        () => invoke({ name: 'retrieve_memories', props: query, auth }),
        /INCOMPLETE_RESULT_SET/
      );
    },
  });
});

test('final results use only the final stage, its scores, order, and memory metadata', async () => {
  await withServer({
    handler: () =>
      ndjson([
        ...stage({ id: rawId, chunks: [first, second] }),
        ...stage({ id: finalId, chunks: [second, first], score: 0.7 }),
        {
          memoryDefinition: { ...memory, metadata: { source: 'joined-by-id' } },
        },
      ]),
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'retrieve_memories',
        props: query,
        auth,
      });
      assert.equal(result.partial, false);
      assert.equal(result.totalResults, 2);
      assert.equal(result.resultSetId, finalId);
      assert.deepEqual(
        result.results.map((result) => result.chunkId),
        [second.chunkId, first.chunkId]
      );
      assert.ok(
        result.results.every(
          (result) =>
            result.resultSetId === finalId && result.relevanceScore === 0.7
        )
      );
      assert.equal(result.results[0].source, 'joined-by-id');
    },
  });
});

test('a final empty set does not resurrect superseded candidates', async () => {
  await withServer({
    handler: () =>
      ndjson([
        ...stage({ id: rawId, chunks: [first] }),
        ...stage({ id: finalId, chunks: [] }),
      ]),
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'retrieve_memories',
        props: query,
        auth,
      });
      assert.equal(result.resultSetId, finalId);
      assert.equal(result.totalResults, 0);
      assert.equal(result.partial, false);
    },
  });
});

test('an unfinished later stage falls back to the last complete set with a partial flag', async () => {
  await withServer({
    handler: () =>
      ndjson([
        ...stage({ id: rawId, chunks: [first, second] }),
        ...stage({ id: finalId, chunks: [second], score: 0.7 }).slice(0, -1),
      ]),
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'retrieve_memories',
        props: query,
        auth,
      });
      assert.equal(result.resultSetId, rawId);
      assert.equal(result.partial, true);
      assert.deepEqual(
        result.results.map((result) => result.chunkId),
        [first.chunkId, second.chunkId]
      );
      assert.equal(result.statuses[0].details.result_set_id, finalId);
    },
  });
});

for (const firstMatchesEmbedder of [true, false]) {
  test(`space names are checked for ambiguity across pages before embedder matching (${firstMatchesEmbedder})`, async () => {
    await withServer({
      handler: (request) => ({
        body: request.url.includes('nextToken=second')
          ? {
              spaces: [
                {
                  spaceId: randomUUID(),
                  ownerId: randomUUID(),
                  name: 'Shared',
                  spaceEmbedders: [{ embedderId }],
                },
              ],
            }
          : {
              spaces: [
                {
                  spaceId,
                  ownerId: randomUUID(),
                  name: 'Shared',
                  spaceEmbedders: [
                    {
                      embedderId: firstMatchesEmbedder
                        ? embedderId
                        : randomUUID(),
                    },
                  ],
                },
              ],
              nextToken: 'second',
            },
      }),
      exercise: async ({ auth, requests }) => {
        await assert.rejects(
          () =>
            invoke({
              name: 'create_space',
              props: { name: 'Shared', embedderId },
              auth,
            }),
          /Multiple accessible spaces.*explicit space ID/
        );
        assert.equal(requests.length, 2);
        assert.ok(requests.every((request) => request.method === 'GET'));
      },
    });
  });
}

test('indexing expiration during HTTP I/O returns the accepted ID and timedOut true', async () => {
  await withServer({
    handler: async (request) => {
      if (request.method === 'GET')
        await new Promise((resolve) => setTimeout(resolve, 1500));
      return { body: { ...memory, processingStatus: 'PENDING' } };
    },
    exercise: async ({ auth, requests }) => {
      const started = performance.now();
      const result = await invoke({
        name: 'create_memory',
        props: {
          spaceId,
          textContent: 'Write exactly once',
          indexingTimeout: 1,
        },
        auth,
      });
      assert.equal(result.memoryId, memoryId);
      assert.equal(result.indexing.timedOut, true);
      assert.equal(result.indexing.ready, false);
      assert.equal(result.partial, true);
      assert.match(result.indexingError, /timed out/);
      assert.equal(
        requests.filter((request) => request.method === 'POST').length,
        1
      );
      assert.equal(
        requests.filter((request) => request.method === 'GET').length,
        1
      );
      assert.ok(performance.now() - started < 1800);
    },
  });
});

for (const { contentType, content, bytes } of [
  {
    contentType: 'text/plain',
    content: 'Quarterly café – 東京',
    bytes: Buffer.from('Quarterly café – 東京'),
  },
  {
    contentType: 'text/plain; charset="utf-16le"',
    content: 'Quarterly café – 東京',
    bytes: Buffer.from('Quarterly café – 東京', 'utf16le'),
  },
  {
    contentType: 'text/plain; charset=iso-8859-1',
    content: 'Quarterly café',
    bytes: Buffer.from('Quarterly café', 'latin1'),
  },
]) {
  test(`text decoding respects ${contentType}`, async () => {
    await withServer({
      handler: (request) =>
        request.url.endsWith('/content')
          ? { type: contentType, body: bytes }
          : { body: memory },
      exercise: async ({ auth }) => {
        const result = await invoke({
          name: 'get_memory',
          props: { memoryId },
          auth,
        });
        assert.equal(result.content, content);
        assert.notEqual(result.partial, true);
      },
    });
  });
}

for (const { contentType, bytes } of [
  {
    contentType: 'text/plain; charset=unsupported-charset',
    bytes: Buffer.from('hello'),
  },
  {
    contentType: 'text/plain; charset=utf-8',
    bytes: Buffer.from([0xff, 0xfe, 0xfd]),
  },
]) {
  test(`undecodable ${contentType} reports a limitation instead of corrupting text`, async () => {
    await withServer({
      handler: (request) =>
        request.url.endsWith('/content')
          ? { type: contentType, body: bytes }
          : { body: memory },
      exercise: async ({ auth }) => {
        const result = await invoke({
          name: 'get_memory',
          props: { memoryId },
          auth,
        });
        assert.equal(result.memory.memoryId, memoryId);
        assert.equal(result.content, undefined);
        assert.equal(result.partial, true);
        assert.ok(result.contentError.length > 0);
      },
    });
  });
}

test('chronological-only retrieval is rejected before calling an unsupported server path', async () => {
  await withServer({
    handler: () => ndjson(stage({ id: rawId, chunks: [first] })),
    exercise: async ({ auth, requests }) => {
      await assert.rejects(
        () =>
          invoke({
            name: 'retrieve_memories',
            props: { ...query, chronologicalResort: true },
            auth,
          }),
        /Chronological resort currently requires a reranker/
      );
      assert.equal(requests.length, 0);
    },
  });
});

test('chronological retrieval preserves returned order instead of re-sorting reranker scores', async () => {
  const newerId = randomUUID();
  const newer = { ...second, memoryId: newerId };
  const final = stage({ id: finalId, chunks: [first, newer], score: 0.2 });
  final[2].retrievedItem.chunk.relevanceScore = 0.9;
  await withServer({
    handler: () =>
      ndjson([
        { memoryDefinition: { ...memory, createdAt: 1000 } },
        { memoryDefinition: { ...memory, memoryId: newerId, createdAt: 2000 } },
        ...final,
      ]),
    exercise: async ({ auth, requests }) => {
      const result = await invoke({
        name: 'retrieve_memories',
        props: {
          ...query,
          chronologicalResort: true,
          rerankerId: randomUUID(),
        },
        auth,
      });
      assert.equal(
        requests[0].body.postProcessor.config.chronological_resort,
        true
      );
      assert.equal(requests[0].body.postProcessor.config.llm_id, undefined);
      assert.deepEqual(
        result.results.map((result) => result.memoryId),
        [memoryId, newerId]
      );
      assert.deepEqual(
        result.results.map((result) => result.relevanceScore),
        [0.2, 0.9]
      );
    },
  });
});
