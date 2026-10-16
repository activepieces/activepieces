const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pastdotdev } = require('../dist/src/index.js');

const spend = process.argv.includes('--spend');

main().catch((error) => {
  console.error(`FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

async function main() {
  const { apiKey, apiHost } = readConnection();
  const auth = { type: 'CUSTOM_AUTH', props: { apiKey, apiHost } };
  const server = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };
  const propertyContext = {
    server: { apiUrl: '', publicUrl: '', token: '' },
    project: { id: 'live-check', externalId: async () => undefined },
    connections: { get: async () => null },
  };

  const actions = pastdotdev.actions();
  const validation = await pastdotdev.auth.validate({ auth: { apiKey, apiHost }, server });
  report('connection test (GET /api/v1/audiences, no credits)', validation.valid, validation.error);

  const audiences = await actions['ingest'].props.audience.options({ auth }, propertyContext);
  report(`audience dropdown (${audiences.options.length} options)`, !audiences.disabled, audiences.placeholder);

  const identities = await actions['recall'].props.identity.options({ auth }, propertyContext);
  report(`identity dropdown (${identities.options.length} options)`, !identities.disabled, identities.placeholder);

  if (!spend) {
    console.log('Skipped Ingest, Recall and Delete data point. Run with --spend to spend a few credits on them.');
    return;
  }

  const identity = 'activepieces-live-check';
  const sourceId = `activepieces-live-check-${Date.now()}`;
  const ingest = await actions['ingest'].run(
    actionContext({
      auth,
      propsValue: {
        content: 'The Activepieces live check ran. The test favourite colour is teal.',
        identity,
        id: sourceId,
        label: 'Activepieces live check',
        metadata: { source: 'activepieces-live-check' },
      },
    })
  );
  report(`Ingest (status ${ingest.status}, sourceId ${ingest.sourceId})`, ingest.sourceId === sourceId);

  const recall = await actions['recall'].run(
    actionContext({
      auth,
      propsValue: { query: 'What is the test favourite colour?', identity, limit: 5 },
    })
  );
  report(`Recall (${recall.resultCount} results, request ${recall.requestId ?? 'none'})`, Array.isArray(recall.results));

  const deletion = await actions['delete_data_point'].run(
    actionContext({ auth, propsValue: { sourceId } })
  );
  report(`Delete data point (operation ${deletion.operationId})`, deletion.ids.includes(sourceId));
}

function actionContext({ auth, propsValue }) {
  return { auth, propsValue, store: {}, server: {}, project: {}, files: {} };
}

function report(label, ok, detail) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${!ok && detail ? `: ${detail}` : ''}`);
  if (!ok) {
    process.exitCode = 1;
  }
}

function readConnection() {
  const fromFile = readEnvFile(path.join(os.homedir(), '.past', 'integrations-test.env'));
  const apiKey = process.env.PAST_API_KEY ?? fromFile.PAST_API_KEY;
  const apiHost = process.env.PAST_API_HOST ?? fromFile.PAST_API_HOST;
  if (!apiKey) {
    throw new Error('No key. Set PAST_API_KEY, or write it to ~/.past/integrations-test.env.');
  }
  return { apiKey, apiHost };
}

function readEnvFile(file) {
  if (!fs.existsSync(file)) {
    return {};
  }
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf-8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}
