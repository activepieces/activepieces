import { test } from 'vitest';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ApFile } from '@activepieces/pieces-framework';
import { actions, goodmemAuth, invoke, ndjson, withServer } from './wire.mjs';

const spaceId = randomUUID();
const memoryId = randomUUID();
const embedderId = randomUUID();
const resultSetId = randomUUID();
const memory = {
  memoryId,
  spaceId,
  metadata: { source: 'manual.pdf', tenant: 'alpha' },
  processingStatus: 'COMPLETED',
  contentType: 'text/plain',
};
const chunk = {
  chunkId: randomUUID(),
  memoryId,
  chunkText: 'Launch code MARIGOLD-482',
  metadata: { source_page_start_index: 3 },
};
const events = [
  { resultSetBoundary: { resultSetId, kind: 'BEGIN', stageName: 'retrieve' } },
  { memoryDefinition: memory },
  {
    retrievedItem: {
      chunk: { resultSetId, chunk, memoryIndex: 0, relevanceScore: -0.91 },
    },
  },
  { resultSetBoundary: { resultSetId, kind: 'END', stageName: '' } },
];
const query = { query: 'What is the launch code?', spaceIds: [spaceId] };

test('a relevance threshold requires a reranker rather than being silently ignored', async () => {
  await withServer({
    handler: () => ndjson(events),
    exercise: async ({ auth, requests }) => {
      await assert.rejects(
        () =>
          invoke({
            name: 'retrieve_memories',
            props: { ...query, relevanceThreshold: 0.5 },
            auth,
          }),
        /reranker/
      );
      assert.equal(requests.length, 0);
    },
  });
});

test('connection validation uses the SDK and rejects an HTTP 401', async () => {
  await withServer({
    handler: () => ({ status: 401, body: { message: 'Invalid API key' } }),
    exercise: async ({ auth }) => {
      assert.equal((await goodmemAuth.validate({ auth })).valid, false);
    },
  });
});

test('retrieval preserves chunk text, IDs, score, metadata and memory linkage', async () => {
  await withServer({
    handler: () => ndjson(events),
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'retrieve_memories',
        props: query,
        auth,
      });
      assert.equal(result.results[0].chunkText, chunk.chunkText);
      assert.equal(result.results[0].chunkId, chunk.chunkId);
      assert.equal(result.results[0].memoryId, memoryId);
      assert.equal(result.results[0].relevanceScore, -0.91);
      assert.equal(result.results[0].memoryIndex, 0);
      assert.equal(result.results[0].source, 'manual.pdf');
      assert.deepEqual(result.results[0].metadata, chunk.metadata);
      assert.deepEqual(result.memories, [memory]);
      assert.equal(result.partial, false);
    },
  });
});

test('multiple chunks from the same memory are retained', async () => {
  const second = {
    ...chunk,
    chunkId: randomUUID(),
    chunkText: 'Second relevant passage',
  };
  await withServer({
    handler: () =>
      ndjson([
        ...events.slice(0, -1),
        {
          retrievedItem: {
            chunk: {
              resultSetId,
              chunk: second,
              memoryIndex: 0,
              relevanceScore: -0.8,
            },
          },
        },
        events.at(-1),
      ]),
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'retrieve_memories',
        props: query,
        auth,
      });
      assert.deepEqual(
        result.results.map((result) => result.chunkText),
        [chunk.chunkText, second.chunkText]
      );
    },
  });
});

for (const code of [
  'RERANKING_FAILED',
  'SUMMARIZATION_FAILED',
  'FUTURE_SERVER_WARNING',
]) {
  test(`usable results survive ${code}, with a visible partial flag`, async () => {
    await withServer({
      handler: () =>
        ndjson([
          ...events,
          { status: { code, message: 'Recoverable diagnostic' } },
        ]),
      exercise: async ({ auth }) => {
        const result = await invoke({
          name: 'retrieve_memories',
          props: query,
          auth,
        });
        assert.equal(result.results[0].chunkText, chunk.chunkText);
        assert.equal(result.statuses[0].message, 'Recoverable diagnostic');
        assert.equal(result.partial, true);
      },
    });
  });
}

for (const code of ['FEATURE_DISABLED', 'LLM_CAPABILITY_INFERRED']) {
  test(`${code} remains visible without marking complete results partial`, async () => {
    await withServer({
      handler: () =>
        ndjson([
          ...events,
          { status: { code, message: 'Informational notice' } },
        ]),
      exercise: async ({ auth }) => {
        const result = await invoke({
          name: 'retrieve_memories',
          props: query,
          auth,
        });
        assert.equal(result.statuses[0].code, code);
        assert.equal(result.partial, false);
      },
    });
  });
}

test('a status-only failure throws instead of claiming a successful empty search', async () => {
  await withServer({
    handler: () =>
      ndjson([
        { status: { code: 'INVALID_ARGUMENT', message: 'Invalid query' } },
      ]),
    exercise: async ({ auth }) => {
      await assert.rejects(
        () => invoke({ name: 'retrieve_memories', props: query, auth }),
        /Invalid query/
      );
    },
  });
});

test('malformed NDJSON is rejected by the real SDK', async () => {
  await withServer({
    handler: () => ({
      type: 'application/x-ndjson',
      body: ndjson(events).body + '{"retrievedItem":\n',
    }),
    exercise: async ({ auth }) => {
      await assert.rejects(() =>
        invoke({ name: 'retrieve_memories', props: query, auth })
      );
    },
  });
});

test('an empty search makes one request and returns immediately', async () => {
  await withServer({
    handler: () => ndjson([events[0], events[3]]),
    exercise: async ({ auth, requests }) => {
      const start = performance.now();
      const result = await invoke({
        name: 'retrieve_memories',
        props: query,
        auth,
      });
      assert.equal(result.totalResults, 0);
      assert.equal(result.partial, false);
      assert.equal(requests.length, 1);
      assert.ok(performance.now() - start < 2000);
      assert.equal(actions.retrieve_memories.props.waitForIndexing, undefined);
    },
  });
});

for (const [name, props] of [
  ['create_space', { name: 'new-space', embedderId }],
  ['create_memory', { spaceId, textContent: 'Audit note' }],
  ['retrieve_memories', query],
  ['get_memory', { memoryId }],
  ['delete_memory', { memoryId }],
]) {
  test(`${name} propagates HTTP 401 for workflow failure handling`, async () => {
    await withServer({
      handler: () => ({ status: 401, body: { message: 'Invalid API key' } }),
      exercise: async ({ auth }) => {
        await assert.rejects(() => invoke({ name, props, auth }), /401/);
      },
    });
  });
}

for (const [name, property] of [
  ['create_memory', 'spaceId'],
  ['retrieve_memories', 'spaceIds'],
]) {
  test(`${name} space picker follows SDK pagination`, async () => {
    const later = { spaceId: randomUUID(), name: 'second-page' };
    await withServer({
      handler: (request) => ({
        body: request.url.includes('nextToken=page2')
          ? { spaces: [later] }
          : { spaces: [{ spaceId, name: 'first-page' }], nextToken: 'page2' },
      }),
      exercise: async ({ auth }) => {
        const options = await actions[name].props[property].options({
          auth: { props: auth },
        });
        assert.ok(
          options.options.some((option) => option.value === later.spaceId)
        );
      },
    });
  });
}

test('create-space finds a compatible same-name space on a later page', async () => {
  const existing = {
    spaceId,
    name: 'existing-name',
    spaceEmbedders: [{ embedderId }],
  };
  await withServer({
    handler: (request) => ({
      body: request.url.includes('nextToken=page2')
        ? { spaces: [existing] }
        : { spaces: [], nextToken: 'page2' },
    }),
    exercise: async ({ auth, requests }) => {
      const result = await invoke({
        name: 'create_space',
        props: { name: existing.name, embedderId },
        auth,
      });
      assert.equal(result.spaceId, spaceId);
      assert.equal(result.reused, true);
      assert.ok(requests.every((request) => request.method === 'GET'));
      assert.ok(requests[0].url.includes('nameFilter=existing-name'));
    },
  });
});

test('create-space refuses an incompatible embedder', async () => {
  await withServer({
    handler: () => ({
      body: {
        spaces: [
          {
            spaceId,
            name: 'existing-name',
            spaceEmbedders: [{ embedderId: randomUUID() }],
          },
        ],
      },
    }),
    exercise: async ({ auth }) => {
      await assert.rejects(
        () =>
          invoke({
            name: 'create_space',
            props: { name: 'existing-name', embedderId },
            auth,
          }),
        /different embedder/
      );
    },
  });
});

test('create-space respects zero overlap', async () => {
  await withServer({
    handler: (request) => ({
      body:
        request.method === 'GET'
          ? { spaces: [] }
          : { spaceId, name: 'zero-overlap' },
    }),
    exercise: async ({ auth, requests }) => {
      await invoke({
        name: 'create_space',
        props: {
          name: 'zero-overlap',
          embedderId,
          advancedChunking: { chunkSize: 80, chunkOverlap: 0 },
        },
        auth,
      });
      assert.equal(
        requests.find((request) => request.method === 'POST').body
          .defaultChunkingConfig.recursive.chunkOverlap,
        0
      );
    },
  });
});

test('small chunk sizes get a valid default overlap', async () => {
  await withServer({
    handler: (request) => ({
      body:
        request.method === 'GET'
          ? { spaces: [] }
          : { spaceId, name: 'small-chunks' },
    }),
    exercise: async ({ auth, requests }) => {
      await invoke({
        name: 'create_space',
        props: {
          name: 'small-chunks',
          embedderId,
          advancedChunking: { chunkSize: 10 },
        },
        auth,
      });
      const recursive = requests.find((request) => request.method === 'POST')
        .body.defaultChunkingConfig.recursive;
      assert.ok(recursive.chunkOverlap < recursive.chunkSize);
    },
  });
});

test('text ingestion preserves content and metadata without waiting when disabled', async () => {
  await withServer({
    handler: () => ({ body: memory }),
    exercise: async ({ auth, requests }) => {
      const result = await invoke({
        name: 'create_memory',
        props: {
          spaceId,
          textContent: chunk.chunkText,
          metadata: { tenant: 'alpha' },
          tags: 'one, two',
          waitForIndexing: false,
        },
        auth,
      });
      assert.equal(result.memoryId, memoryId);
      assert.equal(requests.length, 1);
      assert.equal(requests[0].body.originalContent, chunk.chunkText);
      assert.deepEqual(requests[0].body.metadata, {
        tenant: 'alpha',
        tags: ['one', 'two'],
      });
    },
  });
});

for (const mode of ['completed', 'timeout', 'http-error', 'failed']) {
  test(`indexing ${mode} preserves the accepted ID and never repeats the write`, async () => {
    await withServer({
      handler: (request) => {
        if (request.method === 'POST')
          return { body: { ...memory, processingStatus: 'PENDING' } };
        if (mode === 'http-error')
          return { status: 503, body: { message: 'Temporary failure' } };
        return {
          body: {
            ...memory,
            processingStatus:
              mode === 'completed'
                ? 'COMPLETED'
                : mode === 'failed'
                ? 'FAILED'
                : 'PENDING',
          },
        };
      },
      exercise: async ({ auth, requests }) => {
        const result = await invoke({
          name: 'create_memory',
          props: { spaceId, textContent: 'Save once', indexingTimeout: 1 },
          auth,
        });
        assert.equal(result.memoryId, memoryId);
        assert.equal(
          requests.filter((request) => request.method === 'POST').length,
          1
        );
        assert.ok(
          requests
            .filter((request) => request.method === 'GET')
            .every((request) => request.url === `/v1/memories/${memoryId}`)
        );
        assert.equal(result.indexing.ready, mode === 'completed');
        if (mode !== 'completed') assert.equal(result.partial, true);
        if (mode === 'timeout') assert.equal(result.indexing.timedOut, true);
        if (mode === 'http-error') assert.match(result.indexingError, /503/);
      },
    });
  });
}

test('file ingestion uses the SDK multipart upload and preserves filename and bytes', async () => {
  const bytes = Buffer.from('%PDF-audit-binary\0\x01');
  await withServer({
    handler: () => ({ body: memory }),
    exercise: async ({ auth, requests }) => {
      await invoke({
        name: 'create_memory',
        props: {
          spaceId,
          file: new ApFile('audit.pdf', bytes, 'pdf'),
          waitForIndexing: false,
        },
        auth,
      });
      assert.equal(requests[0].body.metadata.filename, 'audit.pdf');
      assert.deepEqual(
        Buffer.from(await requests[0].form.get('file').arrayBuffer()),
        bytes
      );
    },
  });
});

test('get-memory downloads readable text through the SDK content endpoint', async () => {
  await withServer({
    handler: (request) =>
      request.url.endsWith('/content')
        ? { type: 'text/plain', body: chunk.chunkText }
        : { body: memory },
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'get_memory',
        props: { memoryId },
        auth,
      });
      assert.equal(result.content, chunk.chunkText);
    },
  });
});

test('binary get-memory delivers a file through the Activepieces file service', async () => {
  const bytes = Buffer.from('%PDF-binary\0\x01');
  await withServer({
    handler: (request) =>
      request.url.endsWith('/content')
        ? { type: 'application/pdf', body: bytes }
        : { body: { ...memory, metadata: { filename: 'audit.pdf' } } },
    exercise: async ({ auth }) => {
      const writes = [];
      const result = await invoke({
        name: 'get_memory',
        props: { memoryId },
        auth,
        files: {
          write: async (request) => {
            writes.push(request);
            return 'https://files.example/audit.pdf';
          },
        },
      });
      assert.equal(result.file, 'https://files.example/audit.pdf');
      assert.equal(writes[0].fileName, 'audit.pdf');
      assert.deepEqual(writes[0].data, bytes);
    },
  });
});

test('failed content download retains metadata and reports partial results', async () => {
  await withServer({
    handler: (request) =>
      request.url.endsWith('/content')
        ? { status: 404, body: { message: 'No inline content' } }
        : { body: memory },
    exercise: async ({ auth }) => {
      const result = await invoke({
        name: 'get_memory',
        props: { memoryId },
        auth,
      });
      assert.equal(result.memory.memoryId, memoryId);
      assert.equal(result.partial, true);
      assert.match(result.contentError, /404/);
    },
  });
});

test('metadata filtering reaches the SDK without requiring models', async () => {
  const filter = "CAST(val('$.tenant') AS text) = 'alpha'";
  await withServer({
    handler: () => ndjson(events),
    exercise: async ({ auth, requests }) => {
      await invoke({
        name: 'retrieve_memories',
        props: { ...query, filter },
        auth,
      });
      assert.equal(requests[0].body.spaceKeys[0].filter, filter);
      assert.equal(requests[0].body.postProcessor, undefined);
    },
  });
});
