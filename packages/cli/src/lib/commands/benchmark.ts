import autocannon from 'autocannon';
import axios, { AxiosInstance, AxiosError } from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';

const BENCHMARK_DOC = 'Create a webhook -> data-mapper -> return-response flow, then load-test its sync endpoint.';

export const benchmarkCommand = new Command('benchmark')
    .description(BENCHMARK_DOC)
    .option('--url <url>', 'Activepieces base URL (dev env API port)', 'http://localhost:3000')
    .option('--requests <n>', 'Total number of requests to fire', '500')
    .option('--concurrency <c>', 'Number of concurrent connections', '10')
    .option('--api-key <key>', 'Platform API key or user token (Bearer). Or set AP_API_KEY. Requires --project-id.')
    .option('--project-id <id>', 'Project to create the benchmark flow in (required with --api-key)')
    .option('--email <email>', 'Login email (alternative to --api-key; resolves the project automatically)')
    .option('--password <password>', 'Login password')
    .option('--body <json>', 'JSON request body sent to the webhook', '{"test":true}')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (opts) => {
        const config = benchmarkUtils.normalizeOptions(opts);
        try {
            const client = axios.create({ baseURL: config.url, validateStatus: () => true });
            await waitForReady(client);
            const auth = await authenticate({ client, config });
            const authed = axios.create({
                baseURL: config.url,
                headers: { Authorization: `Bearer ${auth.token}` },
                validateStatus: () => true,
            });
            const flowId = await createBenchmarkFlow({ client: authed, projectId: auth.projectId });
            log(config, `Flow ready: ${flowId}`);

            const result = await autocannon({
                url: `${config.url}/api/v1/webhooks/${flowId}/sync`,
                connections: config.concurrency,
                amount: config.requests,
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: config.body,
            });

            const summary = benchmarkUtils.toSummary({ result, flowId, connections: config.concurrency });
            if (config.json) {
                process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
            } else {
                renderSummary(summary);
            }
            process.exit(summary.failed > 0 ? 1 : 0);
        } catch (e) {
            const message = e instanceof AxiosError ? `${e.message}${e.response ? ` (HTTP ${e.response.status}: ${JSON.stringify(e.response.data)})` : ''}` : e instanceof Error ? e.message : String(e);
            if (config.json) {
                process.stdout.write(JSON.stringify({ error: message }) + '\n');
            } else {
                console.error(chalk.red(`Benchmark failed: ${message}`));
            }
            process.exit(2);
        }
    });

function normalizeOptions(opts: Record<string, string | boolean | undefined>): BenchmarkConfig {
    const requests = Number(opts.requests);
    const concurrency = Number(opts.concurrency);
    if (!Number.isInteger(requests) || requests <= 0) {
        throw new Error(`--requests must be a positive integer, got "${opts.requests}"`);
    }
    if (!Number.isInteger(concurrency) || concurrency <= 0) {
        throw new Error(`--concurrency must be a positive integer, got "${opts.concurrency}"`);
    }
    const body = String(opts.body);
    try {
        JSON.parse(body);
    } catch {
        throw new Error(`--body must be valid JSON, got "${opts.body}"`);
    }
    const url = String(opts.url);
    return {
        url: url.endsWith('/') ? url.slice(0, -1) : url,
        requests,
        concurrency,
        apiKey: typeof opts.apiKey === 'string' ? opts.apiKey : undefined,
        projectId: typeof opts.projectId === 'string' ? opts.projectId : undefined,
        email: typeof opts.email === 'string' ? opts.email : undefined,
        password: typeof opts.password === 'string' ? opts.password : undefined,
        body,
        json: opts.json === true,
    };
}

function toSummary({ result, flowId, connections }: ToSummaryParams): Summary {
    const failed = result.non2xx + result.errors + result.timeouts;
    return {
        flowId,
        requests: result.requests.sent,
        connections,
        durationSec: result.duration,
        throughputReqSec: result.requests.average,
        latencyMeanMs: result.latency.mean,
        p50Ms: result.latency.p50,
        p90Ms: result.latency.p90,
        p99Ms: result.latency.p99,
        minMs: result.latency.min,
        maxMs: result.latency.max,
        ok2xx: result['2xx'],
        non2xx: result.non2xx,
        errors: result.errors,
        timeouts: result.timeouts,
        failed,
    };
}

async function waitForReady(client: AxiosInstance): Promise<void> {
    for (let i = 0; i < 60; i++) {
        const res = await client.get('/api/v1/flags').catch(() => null);
        if (res && res.status === 200) return;
        await sleep(2000);
    }
    throw new Error('Server did not become ready in time (checked /api/v1/flags)');
}

async function authenticate({ client, config }: { client: AxiosInstance; config: BenchmarkConfig }): Promise<AuthResult> {
    const apiKey = config.apiKey ?? process.env.AP_API_KEY;
    if (apiKey) {
        if (!config.projectId) {
            throw new Error('When using --api-key (or AP_API_KEY), also pass --project-id.');
        }
        return { token: apiKey, projectId: config.projectId };
    }

    if (config.email && config.password) {
        const signIn = await client.post('/api/v1/authentication/sign-in', { email: config.email, password: config.password });
        const token: string | undefined = signIn.data?.token;
        if (!token) {
            throw new Error(`Login failed: ${JSON.stringify(signIn.data)}`);
        }
        const projectId: string | undefined = config.projectId ?? signIn.data?.projectId ?? undefined;
        if (!projectId) {
            throw new Error('Login succeeded but returned no project; pass --project-id.');
        }
        return { token, projectId };
    }

    throw new Error('Provide credentials: --api-key/--token with --project-id, or --email and --password.');
}

async function createBenchmarkFlow({ client, projectId }: { client: AxiosInstance; projectId: string }): Promise<string> {
    const [webhookVersion, mapperVersion] = await Promise.all([
        resolvePieceVersion(client, WEBHOOK_PIECE),
        resolvePieceVersion(client, DATA_MAPPER_PIECE),
    ]);

    const created = await client.post('/api/v1/flows', { displayName: 'Benchmark Flow', projectId });
    const flowId: string | undefined = created.data?.id;
    if (!flowId) {
        throw new Error(`Failed to create flow: ${JSON.stringify(created.data)}`);
    }

    await postOperation(client, flowId, {
        type: 'IMPORT_FLOW',
        request: buildImportRequest({ webhookVersion, mapperVersion }),
    });
    await postOperation(client, flowId, { type: 'LOCK_AND_PUBLISH', request: { status: 'ENABLED' } });
    await waitForEnabled(client, flowId);
    return flowId;
}

async function resolvePieceVersion(client: AxiosInstance, name: string): Promise<string> {
    const res = await client.get(`/api/v1/pieces/${encodeURIComponent(name)}`);
    const version: string | undefined = res.data?.version;
    if (!version) {
        throw new Error(`Piece ${name} not available on server (is it synced?): HTTP ${res.status}`);
    }
    return `~${version}`;
}

async function postOperation(client: AxiosInstance, flowId: string, operation: unknown): Promise<void> {
    const res = await client.post(`/api/v1/flows/${flowId}`, operation);
    if (res.status >= 400) {
        throw new Error(`Flow operation failed (HTTP ${res.status}): ${JSON.stringify(res.data)}`);
    }
}

async function waitForEnabled(client: AxiosInstance, flowId: string): Promise<void> {
    for (let i = 0; i < 30; i++) {
        const res = await client.get(`/api/v1/flows/${flowId}`);
        if (res.data?.status === 'ENABLED') return;
        await sleep(1000);
    }
    console.error(chalk.yellow('Flow did not report ENABLED within 30s; proceeding anyway.'));
}

// schemaVersion:null makes the server migrate this payload up to its own latest schema,
// so the same payload stays valid across server versions without CLI maintenance.
function buildImportRequest({ webhookVersion, mapperVersion }: { webhookVersion: string; mapperVersion: string }): unknown {
    return {
        displayName: 'Benchmark Flow',
        schemaVersion: null,
        notes: [],
        trigger: {
            name: 'trigger',
            valid: true,
            displayName: 'Catch Webhook',
            type: 'PIECE_TRIGGER',
            settings: {
                pieceName: WEBHOOK_PIECE,
                pieceVersion: webhookVersion,
                triggerName: 'catch_webhook',
                input: { authType: 'none', authFields: {} },
                propertySettings: {},
                sampleData: {},
            },
            nextAction: {
                name: 'step_1',
                skip: false,
                type: 'PIECE',
                valid: true,
                displayName: 'Advanced Mapping',
                settings: {
                    pieceName: DATA_MAPPER_PIECE,
                    pieceVersion: mapperVersion,
                    actionName: 'advanced_mapping',
                    input: { mapping: { echo: '{{trigger.body}}' } },
                    propertySettings: {},
                    sampleData: {},
                    errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } },
                },
                nextAction: {
                    name: 'step_2',
                    skip: false,
                    type: 'PIECE',
                    valid: true,
                    displayName: 'Return Response',
                    settings: {
                        pieceName: WEBHOOK_PIECE,
                        pieceVersion: webhookVersion,
                        actionName: 'return_response',
                        input: { fields: { body: '{{step_1}}', status: 200, headers: {} }, respond: 'stop', responseType: 'json' },
                        propertySettings: {},
                        sampleData: {},
                        errorHandlingOptions: { retryOnFailure: { value: false }, continueOnFailure: { value: false } },
                    },
                },
            },
        },
    };
}

function renderSummary(s: Summary): void {
    console.log(chalk.bold(`\nBenchmark results (flow ${s.flowId})`));
    console.log(`  requests     : ${s.requests} @ ${s.connections} connections in ${s.durationSec.toFixed(1)}s`);
    console.log(`  throughput   : ${s.throughputReqSec.toFixed(1)} req/s`);
    console.log(`  latency mean : ${s.latencyMeanMs.toFixed(1)}ms`);
    console.log(`  p50 / p90 / p99 : ${s.p50Ms.toFixed(1)} / ${s.p90Ms.toFixed(1)} / ${s.p99Ms.toFixed(1)} ms`);
    console.log(`  min / max    : ${s.minMs.toFixed(1)} / ${s.maxMs.toFixed(1)} ms`);
    console.log(`  responses    : ${s.ok2xx} 2xx, ${s.non2xx} non-2xx, ${s.errors} errors, ${s.timeouts} timeouts`);
    if (s.failed > 0) {
        console.log(chalk.yellow(`  ${s.failed} request(s) did not return 2xx`));
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(config: BenchmarkConfig, message: string): void {
    if (!config.json) console.error(chalk.gray(message));
}

const WEBHOOK_PIECE = '@activepieces/piece-webhook';
const DATA_MAPPER_PIECE = '@activepieces/piece-data-mapper';

export const benchmarkUtils = { normalizeOptions, toSummary };

type BenchmarkConfig = {
    url: string;
    requests: number;
    concurrency: number;
    apiKey?: string;
    projectId?: string;
    email?: string;
    password?: string;
    body: string;
    json: boolean;
};

type AuthResult = { token: string; projectId: string };

type LoadResult = {
    requests: { sent: number; average: number };
    latency: { mean: number; p50: number; p90: number; p99: number; min: number; max: number };
    duration: number;
    '2xx': number;
    non2xx: number;
    errors: number;
    timeouts: number;
};

type ToSummaryParams = {
    result: LoadResult;
    flowId: string;
    connections: number;
};

type Summary = {
    flowId: string;
    requests: number;
    connections: number;
    durationSec: number;
    throughputReqSec: number;
    latencyMeanMs: number;
    p50Ms: number;
    p90Ms: number;
    p99Ms: number;
    minMs: number;
    maxMs: number;
    ok2xx: number;
    non2xx: number;
    errors: number;
    timeouts: number;
    failed: number;
};
