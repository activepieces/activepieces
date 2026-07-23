import os from 'os';
import autocannon from 'autocannon';
import axios, { AxiosInstance, AxiosError } from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';
import { Project } from '@activepieces/shared';

const BENCHMARK_DOC = 'Load-test a deployment\'s sync-webhook path, auto-discover its shape, and attribute latency (queue-wait vs service-time) against the recommended setup.';

export const benchmarkCommand = new Command('benchmark')
    .description(BENCHMARK_DOC)
    .option('--url <url>', 'Activepieces base URL (dev env API port)', 'http://localhost:3000')
    .option('--requests <n>', 'Total requests to fire (default: 40 x concurrency)')
    .option('--concurrency <c>', 'Concurrent connections (default: auto = sum of worker execution slots)')
    .option('--api-key <key>', 'Platform API key (Bearer). Or set AP_API_KEY.')
    .option('--body <json>', 'JSON request body sent to the webhook', '{"test":true}')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (opts) => {
        const config = benchmarkUtils.normalizeOptions(opts);
        try {
            const client = axios.create({ baseURL: config.url, validateStatus: () => true });
            await waitForReady(client);
            const auth = authenticate({ config });
            const authed = axios.create({
                baseURL: config.url,
                headers: { Authorization: `Bearer ${auth.token}` },
                validateStatus: () => true,
            });

            const [setup, health, diagnostics, flags, network] = await Promise.all([
                discoverSetup(authed),
                collectHealth(authed),
                collectDiagnostics(authed),
                collectFlags(authed),
                measureNetwork(authed),
            ]);

            const project = await provisionProject({ client: authed });
            log(config, `Provisioned throwaway project ${project.id}`);
            const runsFailed = await (async () => {
                const projectLimits = await collectProjectLimits({ client: authed, projectId: project.id, rateLimiterEnabled: flags['PROJECT_RATE_LIMITER_ENABLED'] === true });
                const flowId = await createBenchmarkFlow({ client: authed, projectId: project.id });
                log(config, `Flow ready: ${flowId}`);

                const slots = setup.executionSlots;
                const phases = benchmarkUtils.resolvePhases({ concurrency: config.concurrency, slots });

                const diagnosticsSampler = startDiagnosticsSampler(authed);
                const runs: PhaseReport[] = [];
                for (const phase of phases) {
                    const requests = config.requests ?? Math.max(200, phase.connections * 40);
                    log(config, `Running ${phase.label}: ${requests} requests @ ${phase.connections} connections`);
                    // createdAfter is compared against the server clock, but this timestamp is the CLI's.
                    // The CLI runs cross-region, so its clock can lead the server's — widen the window by a
                    // skew buffer so runs aren't silently dropped. Safe because each benchmark builds a fresh
                    // flow, so the flowId filter still admits only this run's flow runs.
                    const startedAt = new Date(Date.now() - CLOCK_SKEW_BUFFER_MS).toISOString();
                    const queueSampler = startQueueSampler(authed);
                    const result = await autocannon({
                        url: `${config.url}/api/v1/webhooks/${flowId}/sync`,
                        connections: phase.connections,
                        amount: requests,
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: config.body,
                    });
                    const queueDepth = queueSampler.stop();
                    const summary = benchmarkUtils.toSummary({ result, flowId, connections: phase.connections });
                    const runsInWindow = await collectRuns({ client: authed, projectId: project.id, flowId, since: startedAt });
                    runs.push({ label: phase.label, connections: phase.connections, requests, startedAt, summary, timeline: runsInWindow.timeline, outcomes: runsInWindow.outcomes, queueDepth });
                }

                const diagnosticsTimeline = { intervalMs: DIAGNOSTICS_SAMPLE_INTERVAL_MS, samples: diagnosticsSampler.stop() };
                log(config, 'Scanning other projects for flows that ran during the benchmark...');
                const outsideFlows = await collectOutsideFlows({ client: authed, benchmarkProjectId: project.id, since: runs[0].startedAt });
                const storage = await probeStorage({ client: authed, projectId: project.id, flowId });
                const report: BenchmarkReport = { meta: buildMeta({ url: config.url }), flowId, project: { id: project.id, limits: projectLimits }, health, diagnostics, diagnosticsTimeline, setup, flags, network, storage, outsideFlows, runs };

                if (config.json) {
                    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
                } else {
                    renderReport(report);
                }
                return runs.some((r) => r.summary.failed > 0);
            })().finally(async () => {
                log(config, `Deleting throwaway project ${project.id}`);
                await deleteProject({ client: authed, id: project.id });
            });
            process.exit(runsFailed ? 1 : 0);
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
    const requests = optionalPositiveInt(opts.requests, '--requests');
    const concurrency = optionalPositiveInt(opts.concurrency, '--concurrency');
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
        body,
        json: opts.json === true,
    };
}

function resolvePhases({ concurrency, slots }: ResolvePhasesParams): Phase[] {
    if (concurrency !== undefined) {
        return [{ label: `conc ${concurrency}`, connections: concurrency }];
    }
    const base = slots ?? DEFAULT_CONCURRENCY;
    return [{ label: `conc ${base} (= slots)`, connections: base }];
}

function validateSetup(machines: WorkerMachineWithStatus[]): SetupCheck[] {
    if (machines.length === 0) {
        return [{ dimension: 'workers', status: 'WARN', detail: 'No connected workers reported (need a platform-admin token, or no workers online).' }];
    }
    const props = machines.map((m) => m.information.workerProps);
    const modes = unique(props.map((p) => p.EXECUTION_MODE ?? 'unset'));
    const reuse = unique(props.map((p) => p.REUSE_SANDBOX ?? 'unset'));
    const concs = props.map((p) => parseSlot(p.WORKER_CONCURRENCY));
    const cpus = machines.map((m) => m.information.totalCpuCores);
    const ramsGb = machines.map((m) => m.information.totalAvailableRamInBytes / BYTES_PER_GB);

    return [
        {
            dimension: 'sandbox mode',
            status: modes.length === 1 && modes[0] === 'SANDBOX_CODE_ONLY' ? 'PASS' : 'WARN',
            detail: `EXECUTION_MODE = ${modes.join(', ')} (recommended: SANDBOX_CODE_ONLY)`,
        },
        {
            dimension: 'reuse sandbox',
            status: reuse.length === 1 && reuse[0] === 'true' ? 'PASS' : 'WARN',
            detail: `REUSE_SANDBOX = ${reuse.join(', ')} (recommended: true)`,
        },
        {
            dimension: 'worker concurrency',
            status: concs.every((c) => c === 1) ? 'PASS' : 'WARN',
            detail: `per-worker WORKER_CONCURRENCY = ${unique(concs.map(String)).join(', ')} (recommended: 1, scale by replicas)`,
        },
        {
            dimension: 'worker CPU',
            status: cpus.every((c) => c <= RECOMMENDED_MAX_CPU_CORES + 0.01) ? 'PASS' : 'WARN',
            detail: `cores/worker = ${unique(cpus.map((c) => c.toString())).join(', ')} (recommended: ~0.5 vCPU)`,
        },
        {
            dimension: 'worker RAM',
            status: ramsGb.every((g) => g <= RECOMMENDED_MAX_RAM_GB + 0.3) ? 'PASS' : 'WARN',
            detail: `GB/worker = ${unique(ramsGb.map((g) => g.toFixed(1))).join(', ')} (recommended: ~1 GB)`,
        },
    ];
}

function aggregateTimeline(runs: FlowRunLike[]): TimelineAggregate {
    const phase = (name: TimelinePhaseName): number[] =>
        runs
            .map((r) => r.timeline?.legs?.[0]?.find((p) => p.name === name)?.durationMs)
            .filter((v): v is number => typeof v === 'number');

    const queue = phase('QUEUE');
    const provision = phase('PROVISION');
    const boot = phase('BOOT');
    const run = phase('RUN');
    // A run the rate limiter rejected was re-queued with a >=20s delay (rate-limiter-interceptor.ts,
    // 20s * 2^attempts), so it shows up as a QUEUE outlier of at least that size. Threshold at 15s to
    // absorb app<->worker clock skew. Zero here = the rate limiter added no delay to these runs.
    const rateLimitedRunsCount = queue.filter((q) => q >= RATE_LIMIT_DETECTION_MS).length;
    const waitPerRun = runs
        .map((r) => {
            const legs = r.timeline?.legs?.[0];
            if (!legs) return undefined;
            return legs.filter((p) => p.name !== 'RUN').reduce((sum, p) => sum + p.durationMs, 0);
        })
        .filter((v): v is number => typeof v === 'number');

    return {
        sampleCount: run.length,
        queueWaitP50: percentile(waitPerRun, 50),
        queueWaitP90: percentile(waitPerRun, 90),
        serviceP50: percentile(run, 50),
        serviceP90: percentile(run, 90),
        queueP50: percentile(queue, 50),
        queueP90: percentile(queue, 90),
        queueMax: queue.length > 0 ? Math.max(...queue) : 0,
        provisionP50: percentile(provision, 50),
        bootP50: percentile(boot, 50),
        rateLimitedRunsCount,
    };
}

async function discoverSetup(client: AxiosInstance): Promise<SetupDiscovery> {
    const res = await client.get('/api/v1/worker-machines');
    if (res.status !== 200 || !Array.isArray(res.data)) {
        return { available: false, reason: `worker-machines returned HTTP ${res.status} (platform-admin token required)`, machines: [], executionSlots: undefined, checks: validateSetup([]) };
    }
    const machines: WorkerMachineWithStatus[] = res.data;
    const usable = machines.filter((m) => m.status === 'ONLINE' && typeof m.information?.workerProps?.WORKER_CONCURRENCY === 'string');
    const skipped = machines.length - usable.length;
    const executionSlots = usable.reduce((sum, m) => sum + parseSlot(m.information.workerProps.WORKER_CONCURRENCY), 0);
    const checks = validateSetup(usable);
    if (skipped > 0) {
        checks.unshift({ dimension: 'worker registry', status: 'WARN', detail: `${skipped}/${machines.length} registry entries loo
k stale or incomplete (non-ONLINE or missing worker props) and were excluded from the slot count — if a worker rollout just happen
ed, wait ~60s and re-run.` });
    }
    return { available: true, machines: usable, executionSlots: executionSlots > 0 ? executionSlots : undefined, checks };
}

async function measureNetwork(client: AxiosInstance): Promise<NetworkBaseline> {
    const samples: number[] = [];
    for (let i = 0; i < NETWORK_PROBES; i++) {
        const start = process.hrtime.bigint();
        const res = await client.get('/api/v1/flags').catch(() => null);
        const ms = Number(process.hrtime.bigint() - start) / 1e6;
        if (res && res.status === 200) samples.push(ms);
    }
    return { probes: samples.length, minMs: samples.length ? Math.min(...samples) : 0, p50Ms: percentile(samples, 50) };
}

async function collectRuns({ client, projectId, flowId, since }: CollectRunsParams): Promise<CollectedRuns> {
    const collected: FlowRunLike[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < MAX_RUN_PAGES; page++) {
        const params: Record<string, string | number> = { projectId, flowId, createdAfter: since, limit: RUN_PAGE_SIZE };
        if (cursor) params.cursor = cursor;
        const res = await client.get('/api/v1/flow-runs', { params });
        if (res.status !== 200 || !Array.isArray(res.data?.data)) break;
        collected.push(...res.data.data);
        cursor = res.data.next ?? undefined;
        if (!cursor) break;
    }
    const outcomes: RunOutcomes = {};
    for (const r of collected) {
        const status = r.status ?? 'UNKNOWN';
        outcomes[status] = (outcomes[status] ?? 0) + 1;
    }
    return { timeline: aggregateTimeline(collected), outcomes };
}

async function collectHealth(client: AxiosInstance): Promise<HealthInfo> {
    const res = await client.get('/api/v1/health/system');
    if (res.status !== 200 || typeof res.data !== 'object') {
        return { available: false, reason: `health/system returned HTTP ${res.status} (platform-admin token required)` };
    }
    return { available: true, ...res.data };
}

async function collectDiagnostics(client: AxiosInstance): Promise<DiagnosticsInfo> {
    const res = await client.get('/api/v1/health/diagnostics');
    if (res.status !== 200 || typeof res.data !== 'object') {
        return { available: false, reason: `health/diagnostics returned HTTP ${res.status} (needs platform-admin; server may predate this endpoint)` };
    }
    return { available: true, ...res.data };
}

async function collectFlags(client: AxiosInstance): Promise<Record<string, unknown>> {
    const res = await client.get('/api/v1/flags');
    const all: Record<string, unknown> = res.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : {};
    const picked: Record<string, unknown> = {};
    for (const id of DIAGNOSTIC_FLAGS) {
        if (id in all) picked[id] = all[id];
    }
    return picked;
}

// The one-shot diagnostics block is a single die-roll: a storage probe that reads 231ms at start
// can read 455ms mid-load. This sampler re-probes every few seconds across the whole benchmark and
// keys each sample by time, so variance and load-correlation become visible. App CPU/evloop and
// worker pings only refresh on their ~60s ticks, so consecutive samples may repeat those values.
function startDiagnosticsSampler(client: AxiosInstance): DiagnosticsSampler {
    const samples: Record<string, DiagnosticsSample> = {};
    let stopped = false;
    void (async () => {
        while (!stopped) {
            const sampledAt = new Date().toISOString();
            const res = await client.get('/api/v1/health/diagnostics').catch(() => null);
            if (!stopped && res && res.status === 200 && res.data) {
                const d = res.data;
                const machines = (d.workers?.machines ?? []) as Array<{ serverPingMs?: number | null }>;
                const pings = machines.map((w) => w.serverPingMs).filter((v): v is number => typeof v === 'number');
                samples[sampledAt] = {
                    databaseMs: d.database?.latencyMs ?? null,
                    redisMs: d.redis?.latencyMs ?? null,
                    storageMs: d.storage?.latencyMs ?? null,
                    apps: ((d.apps?.instances ?? []) as Array<{ hostname: string; cpuUsagePercentage: number; eventLoopDelayMs: number } & CpuPressureInfo>)
                        .map((a) => ({ hostname: a.hostname, cpuUsagePercentage: a.cpuUsagePercentage, eventLoopDelayMs: a.eventLoopDelayMs, cpuStealPercentage: a.cpuStealPercentage, cpuThrottledPercentage: a.cpuThrottledPercentage })),
                    workerPingP50Ms: pings.length > 0 ? percentile(pings, 50) : null,
                    workerPingMaxMs: pings.length > 0 ? Math.max(...pings) : null,
                };
            }
            await sleep(DIAGNOSTICS_SAMPLE_INTERVAL_MS);
        }
    })();
    return {
        stop() {
            stopped = true;
            return samples;
        },
    };
}

function startQueueSampler(client: AxiosInstance): QueueSampler {
    const samples: QueueSample[] = [];
    const timer = setInterval(() => {
        client.get('/api/v1/worker-machines/queue-metrics')
            .then((res) => {
                const queues: Array<{ waiting: number; active: number }> = Array.isArray(res.data?.queues) ? res.data.queues : [];
                const waiting = queues.reduce((s, q) => s + (q.waiting ?? 0), 0);
                const active = queues.reduce((s, q) => s + (q.active ?? 0), 0);
                samples.push({ waiting, active });
            })
            .catch(() => undefined);
    }, QUEUE_SAMPLE_INTERVAL_MS);
    return {
        stop() {
            clearInterval(timer);
            if (samples.length === 0) return { samples: 0, available: false };
            return {
                samples: samples.length,
                available: true,
                maxWaiting: Math.max(...samples.map((s) => s.waiting)),
                maxActive: Math.max(...samples.map((s) => s.active)),
                avgWaiting: Math.round(samples.reduce((s, q) => s + q.waiting, 0) / samples.length),
            };
        },
    };
}

function buildMeta({ url }: { url: string }): RunMeta {
    return {
        ranAt: new Date().toISOString(),
        target: url,
        cli: {
            node: process.version,
            platform: `${os.platform()} ${os.arch()}`,
            cpus: os.cpus().length,
            note: 'The CLI runs from a different host/region than the API and workers; all client-side latency below includes CLI→server network. Authoritative per-run latency is server-measured (FlowRun.timeline).',
        },
    };
}

// Flows the benchmark does NOT own that ran inside its window. They share the same execution slots,
// so they are the answer to "why is QUEUE high on a deployment that looks idle". Scans every platform
// project except the benchmark's throwaway one.
async function collectOutsideFlows({ client, benchmarkProjectId, since }: CollectOutsideFlowsParams): Promise<OutsideFlowsReport> {
    const projectsRes = await client.get('/api/v1/projects', { params: { limit: PROJECT_PAGE_SIZE } });
    if (projectsRes.status !== 200 || !Array.isArray(projectsRes.data?.data)) {
        return { available: false, detail: `project listing failed (HTTP ${projectsRes.status}) — cannot scan for outside flows`, flows: [] };
    }
    const notes: string[] = [];
    if (projectsRes.data.next) notes.push(`only the first ${PROJECT_PAGE_SIZE} projects scanned`);
    const projects: Array<{ id: string }> = projectsRes.data.data;

    const outsideRuns: OutsideRunLike[] = [];
    for (const project of projects.filter((p) => p.id !== benchmarkProjectId)) {
        let cursor: string | undefined;
        for (let page = 0; page < MAX_OUTSIDE_RUN_PAGES; page++) {
            const params: Record<string, string | number> = { projectId: project.id, createdAfter: since, limit: RUN_PAGE_SIZE };
            if (cursor) params.cursor = cursor;
            const res = await client.get('/api/v1/flow-runs', { params });
            if (res.status !== 200 || !Array.isArray(res.data?.data)) break;
            outsideRuns.push(...res.data.data.map((r: Record<string, unknown>) => ({ ...r, projectId: project.id }) as OutsideRunLike));
            cursor = res.data.next ?? undefined;
            if (!cursor) break;
            if (page === MAX_OUTSIDE_RUN_PAGES - 1) notes.push(`run listing truncated at ${MAX_OUTSIDE_RUN_PAGES * RUN_PAGE_SIZE} runs for project ${project.id}`);
        }
    }

    const aggregates = aggregateOutsideRuns(outsideRuns);
    if (aggregates.length > MAX_OUTSIDE_FLOWS_DETAILED) notes.push(`pieces/name resolved for the top ${MAX_OUTSIDE_FLOWS_DETAILED} of ${aggregates.length} flows only`);
    const flows: OutsideFlow[] = [];
    for (const [index, aggregate] of aggregates.entries()) {
        const description = index < MAX_OUTSIDE_FLOWS_DETAILED
            ? await describeFlow({ client, flowId: aggregate.flowId, projectId: aggregate.projectId })
            : { displayName: null, pieces: [] };
        flows.push({ ...aggregate, ...description });
    }
    return { available: true, flows, ...(notes.length > 0 ? { detail: notes.join('; ') } : {}) };
}

function aggregateOutsideRuns(runs: OutsideRunLike[]): OutsideFlowAggregate[] {
    const byFlow = new Map<string, { projectId: string; runs: number; totalRunMs: number; timedRuns: number }>();
    for (const run of runs) {
        if (typeof run.flowId !== 'string') continue;
        const entry = byFlow.get(run.flowId) ?? { projectId: run.projectId, runs: 0, totalRunMs: 0, timedRuns: 0 };
        entry.runs += 1;
        const started = Date.parse(run.startTime ?? '');
        const finished = Date.parse(run.finishTime ?? '');
        if (Number.isFinite(started) && Number.isFinite(finished) && finished >= started) {
            entry.totalRunMs += finished - started;
            entry.timedRuns += 1;
        }
        byFlow.set(run.flowId, entry);
    }
    return [...byFlow.entries()]
        .map(([flowId, agg]) => ({ flowId, projectId: agg.projectId, runs: agg.runs, avgRunMs: agg.timedRuns > 0 ? Math.round(agg.totalRunMs / agg.timedRuns) : null }))
        .sort((a, b) => b.runs - a.runs);
}

async function describeFlow({ client, flowId, projectId }: DescribeFlowParams): Promise<FlowDescription> {
    const res = await client.get(`/api/v1/flows/${flowId}`, { params: { projectId } }).catch(() => null);
    if (!res || res.status !== 200 || isNilLike(res.data?.version)) {
        return { displayName: null, pieces: [] };
    }
    const version = res.data.version;
    const pieces = unique([...JSON.stringify(version).matchAll(/"pieceName"\s*:\s*"([^"]+)"/g)].map((m) => m[1]));
    return { displayName: typeof version.displayName === 'string' ? version.displayName : null, pieces };
}

function isNilLike(value: unknown): value is null | undefined {
    return value === null || value === undefined;
}

async function probeStorage({ client, projectId, flowId }: ProbeStorageParams): Promise<StorageProbe> {
    const res = await client.get('/api/v1/flow-runs', { params: { projectId, flowId, limit: 50 } });
    const runs: FlowRunLike[] = Array.isArray(res.data?.data) ? res.data.data : [];
    if (runs.length === 0) {
        return { logsPersisted: 0, sampled: 0, detail: 'No runs found to check log persistence.' };
    }
    const withLog = runs.filter((r) => typeof r.logsFileId === 'string' && r.logsFileId.length > 0).length;
    // logsFileId is written only after the worker's end-of-run backup uploads the log to the configured
    // FILE_STORAGE_LOCATION (S3/GCS or DB). A high rate proves the worker->storage write path works;
    // the write LATENCY itself is inside RUN. The signed-URL fetch path needs a server-minted file token
    // the CLI can't produce, so signed-URL *mode* is not client-detectable — it does not affect run latency.
    return { logsPersisted: withLog, sampled: runs.length, detail: `${withLog}/${runs.length} sampled runs have a persisted log — the worker->storage write path is healthy` };
}

async function waitForReady(client: AxiosInstance): Promise<void> {
    for (let i = 0; i < 60; i++) {
        const res = await client.get('/api/v1/flags').catch(() => null);
        if (res && res.status === 200) return;
        await sleep(2000);
    }
    throw new Error('Server did not become ready in time (checked /api/v1/flags)');
}

function authenticate({ config }: { config: BenchmarkConfig }): AuthResult {
    const apiKey = config.apiKey ?? process.env.AP_API_KEY;
    if (!apiKey) {
        throw new Error('Provide a platform API key via --api-key or the AP_API_KEY env var.');
    }
    return { token: apiKey };
}

// The benchmark always runs in a throwaway project it provisions and deletes, never the caller's own.
// A low maxConcurrentJobs on a real project would queue the load and inflate latency — a measurement
// artifact, not a server problem — so the throwaway project is created with a cap well above any
// realistic slot count, taking the project rate limiter out of the picture entirely.
async function provisionProject({ client }: { client: AxiosInstance }): Promise<ResolvedProject> {
    const res = await client.post('/api/v1/projects', {
        displayName: `benchmark-${Date.now()}`,
        maxConcurrentJobs: EPHEMERAL_PROJECT_MAX_CONCURRENCY,
    });
    if (res.status >= 400 || typeof res.data?.id !== 'string') {
        throw new Error(`Could not create a benchmark project (HTTP ${res.status}: ${JSON.stringify(res.data)}). The API key must be a platform admin key, and the plan must allow team projects.`);
    }
    return { id: res.data.id };
}

async function deleteProject({ client, id }: { client: AxiosInstance; id: string }): Promise<void> {
    await client.delete(`/api/v1/projects/${id}`).catch(() => undefined);
}

// Reads the project's own concurrency cap so a queue-throttled benchmark can be told apart from a slow
// server. PROJECT_RATE_LIMITER_ENABLED gates whether the cap is enforced at all.
async function collectProjectLimits({ client, projectId, rateLimiterEnabled }: CollectProjectLimitsParams): Promise<ProjectLimits> {
    const res = await client.get<Project>(`/api/v1/projects/${projectId}`);
    if (res.status !== 200 || typeof res.data !== 'object') {
        return { available: false, reason: `projects/${projectId} returned HTTP ${res.status}` };
    }
    const maxConcurrentJobs: number | null = res.data?.maxConcurrentJobs ?? null;
    return { available: true, maxConcurrentJobs, rateLimiterEnabled };
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
        statusCodes: { '1xx': result['1xx'] ?? 0, '2xx': result['2xx'] ?? 0, '3xx': result['3xx'] ?? 0, '4xx': result['4xx'] ?? 0, '5xx': result['5xx'] ?? 0 },
        errors: result.errors,
        timeouts: result.timeouts,
        failed,
    };
}

function renderReport(report: BenchmarkReport): void {
    console.log(chalk.bold(`\nBenchmark report (flow ${report.flowId})`));
    console.log(chalk.gray(`  ran ${report.meta.ranAt} against ${report.meta.target}`));
    console.log(chalk.gray(`  CLI host: node ${report.meta.cli.node}, ${report.meta.cli.platform}, ${report.meta.cli.cpus} cpu — different region than API/workers`));

    console.log(chalk.bold('\nVersion & health'));
    if (report.health.available) {
        const r = report.health.release;
        const skew = r && r.workers.versionMismatched > 0
            ? chalk.yellow(`SKEW: ${r.workers.versionMismatched}/${r.workers.total} workers on ${JSON.stringify(r.workers.mismatchedVersions)}`)
            : chalk.green('all workers match app version');
        console.log(`  app version : ${r?.current ?? '?'} (latest available: ${report.health.latestVersion ?? '?'}) — ${skew}`);
        console.log(`  health      : app-cpu=${hb(report.health.appCpu)} app-ram=${hb(report.health.appRam)} disk=${hb(report.health.disk)} worker-cpu=${hb(report.health.workerCpu)} worker-ram=${hb(report.health.workerRam)} db=${hb(report.health.database)}`);
    } else {
        console.log(chalk.yellow(`  skipped: ${report.health.reason}`));
    }

    console.log(chalk.bold('\nInfra round-trip (server-measured, in-region — authoritative, not reachable from the CLI)'));
    if (report.diagnostics.available) {
        const d = report.diagnostics;
        console.log(`  database : ${infra(d.database)}`);
        console.log(`  redis    : ${infra(d.redis)}`);
        console.log(`  storage  : ${infra(d.storage)}   ${chalk.gray('(S3/GCS write+read round-trip; same cost is inside every RUN as the end-of-run log backup)')}`);
        if (d.config) {
            console.log(`  config   : execution=${d.config.executionMode} storage=${d.config.fileStorageLocation} signedUrls=${d.config.s3SignedUrls} sandboxMemKB=${d.config.sandboxMemoryLimitKb} s3=${d.config.s3Endpoint ?? 'n/a'}/${d.config.s3Region ?? 'n/a'} rateLimiter=${d.config.projectRateLimiterEnabled ?? 'n/a'} concurrentJobsLimit=${d.config.defaultConcurrentJobsLimit ?? 'n/a'}`);
        }
        if (d.apps) {
            console.log(`  apps     : ${d.apps.count} connected`);
            for (const a of d.apps.instances) {
                console.log(`    - ${a.hostname} v${a.version} | ${a.cpuCores} core | cpu ${a.cpuUsagePercentage.toFixed(1)}% | ram ${(a.ramTotalBytes / BYTES_PER_GB).toFixed(1)}GB ${a.ramUsagePercentage.toFixed(1)}% | disk ${a.diskPercentage.toFixed(0)}% | evloop ${a.eventLoopDelayMs}ms${cpuPressureLabel(a)}`);
            }
        }
        if (d.workers) {
            console.log(`  workers  : ${d.workers.count} connected`);
            for (const w of d.workers.machines) {
                console.log(`    - ${w.status} ${w.workerId.slice(0, 8)} | ${w.cpuCores} core | cpu ${w.cpuUsagePercentage.toFixed(1)}% | ram ${w.ramUsagePercentage.toFixed(1)}% | worker→app ${w.serverPingMs == null ? 'n/a' : w.serverPingMs + 'ms'}`);
            }
        }
        renderCpuPressureVerdict(d);
    } else {
        console.log(chalk.yellow(`  skipped: ${report.diagnostics.reason}`));
    }

    console.log(chalk.bold('\nConfig flags (server-reported)'));
    if (Object.keys(report.flags).length === 0) {
        console.log(chalk.yellow('  none reported'));
    } else {
        for (const [id, value] of Object.entries(report.flags)) {
            console.log(`  ${id.padEnd(28)} ${JSON.stringify(value)}`);
        }
    }

    console.log(chalk.bold('\nSetup'));
    if (report.setup.available) {
        console.log(`  workers online : ${report.setup.machines.length}, execution slots : ${report.setup.executionSlots ?? '?'}`);
        for (const m of report.setup.machines) {
            const i = m.information;
            console.log(`    - ${m.status} v${i.workerProps.version ?? '?'} | ${i.totalCpuCores} core ${i.cpuUsagePercentage ?? '?'}% cpu | ${(i.totalAvailableRamInBytes / BYTES_PER_GB).toFixed(1)}GB ${i.ramUsagePercentage ?? '?'}% ram | conc ${i.workerProps.WORKER_CONCURRENCY ?? '?'} | ${i.workerProps.EXECUTION_MODE ?? '?'} reuse=${i.workerProps.REUSE_SANDBOX ?? '?'} | sandboxes ${i.sandboxes?.length ?? 0}`);
        }
    } else {
        console.log(chalk.yellow(`  setup discovery skipped: ${report.setup.reason}`));
    }
    for (const c of report.setup.checks) {
        const badge = c.status === 'PASS' ? chalk.green('PASS') : chalk.yellow('WARN');
        console.log(`  [${badge}] ${c.dimension.padEnd(18)} ${c.detail}`);
    }

    console.log(chalk.bold('\nProject'));
    console.log(`  throwaway project (auto-created, deleted after) : ${report.project.id}`);
    if (report.project.limits.available) {
        const cap = report.project.limits.maxConcurrentJobs;
        const capLabel = cap === null ? 'unset (platform default)' : `${cap} concurrent jobs`;
        // The benchmark project is uncapped on purpose, so these numbers can't throttle THIS run — they are
        // reported so you can see whether the platform rate limiter would throttle your real projects.
        console.log(`  benchmark project cap : ${capLabel} (not a bottleneck here)`);
    } else {
        console.log(chalk.yellow(`  project limits skipped: ${report.project.limits.reason}`));
    }

    renderRateLimiter(report);
    renderOutsideFlows(report);
    renderDiagnosticsTimeline(report);

    console.log(chalk.bold('\nNetwork (CLI -> server, cross-region)'));
    console.log(`  RTT min / p50 : ${report.network.minMs.toFixed(1)} / ${report.network.p50Ms.toFixed(1)} ms over ${report.network.probes} probes`);

    for (const run of report.runs) {
        const s = run.summary;
        const t = run.timeline;
        console.log(chalk.bold(`\n${run.label}`));
        console.log(`  throughput   : ${s.throughputReqSec.toFixed(1)} req/s   (${s.requests} reqs in ${s.durationSec.toFixed(1)}s)`);
        console.log(`  run outcomes : ${formatOutcomes(run.outcomes)}   (server-truth: ${s.ok2xx} 2xx, ${s.non2xx} non-2xx [4xx ${s.statusCodes['4xx']}, 5xx ${s.statusCodes['5xx']}], ${s.errors} errors, ${s.timeouts} timeouts)`);
        if (run.queueDepth.available) {
            console.log(`  queue depth  : max waiting ${run.queueDepth.maxWaiting}, max active ${run.queueDepth.maxActive}, avg waiting ${run.queueDepth.avgWaiting}  ${chalk.gray(`(${run.queueDepth.samples} samples, sampled server-side during load)`)}`);
        }
        if (t.sampleCount === 0) {
            console.log(chalk.yellow('  latency: no worker timelines found (server predates the timeline feature #13991, or runs were pruned)'));
        } else {
            console.log(chalk.bold(`  worker-measured latency (authoritative — each phase timed inside the worker, region-independent, ${t.sampleCount} runs):`));
            const rateLimitNote = t.rateLimitedRunsCount > 0
                ? chalk.yellow(`   !! ${t.rateLimitedRunsCount} runs rate-limited (QUEUE >= ${RATE_LIMIT_DETECTION_MS / 1000}s backoff signature)`)
                : '';
            console.log(`    QUEUE      p50/p90/max ${fmt(t.queueP50)} / ${fmt(t.queueP90)} / ${fmt(t.queueMax)} ms   — wait for a free execution slot  ${chalk.gray('(±app↔worker clock skew; cross-check the queue-depth above)')}${rateLimitNote}`);
            console.log(`    PROVISION  p50 ${fmt(t.provisionP50)} ms   — piece install / cache provision`);
            console.log(`    BOOT       p50 ${fmt(t.bootP50)} ms   — engine fork + Node boot + isolate + socket connect`);
            console.log(`    RUN        p50/p90 ${fmt(t.serviceP50)} / ${fmt(t.serviceP90)} ms   — engine executes the flow, incl. end-of-run S3 log backup`);
            console.log(`    => queue-wait p50 ${fmt(t.queueWaitP50)} ms (QUEUE+PROVISION+BOOT) vs service p50 ${fmt(t.serviceP50)} ms (RUN)`);
            console.log(`  ${verdict(t)}`);
        }
        console.log(chalk.gray(`  observational (CLI-side, cross-region — NOT authoritative): client latency p50/p90/p99 ${s.p50Ms.toFixed(0)}/${s.p90Ms.toFixed(0)}/${s.p99Ms.toFixed(0)} ms incl. CLI→server network`));
    }

    console.log(chalk.bold('\nStorage (log persistence — worker→storage write cost is inside RUN above)'));
    console.log(`  ${report.storage.detail}`);

    console.log(chalk.gray('\nShare the full machine-readable bundle for support: re-run with --json > ap-benchmark.json'));
}

// Answers "is the project rate limiter the reason QUEUE is high?" directly: prints whether the
// limiter is on, the cap real projects get, whether the driven load would exceed it, and — the
// decisive signal — whether any benchmark run carries the >=20s re-queue delay the limiter imposes.
function renderRateLimiter(report: BenchmarkReport): void {
    console.log(chalk.bold('\nRate limiter (project concurrency throttle)'));
    const enabled = report.flags['PROJECT_RATE_LIMITER_ENABLED'] === true;
    const defaultLimit = report.flags['DEFAULT_CONCURRENT_JOBS_LIMIT'];
    console.log(`  PROJECT_RATE_LIMITER_ENABLED  : ${enabled ? chalk.yellow('true') : chalk.green('false')}`);
    console.log(`  DEFAULT_CONCURRENT_JOBS_LIMIT : ${JSON.stringify(defaultLimit ?? null)} ${chalk.gray('(cap per real project; the benchmark project is exempt via its own high cap)')}`);

    if (!enabled) {
        console.log(chalk.green('  => rate limiter is OFF — it cannot be the source of any queue time on this deployment.'));
        return;
    }

    const rateLimited = report.runs.reduce((sum, r) => sum + r.timeline.rateLimitedRunsCount, 0);
    const sampled = report.runs.reduce((sum, r) => sum + r.timeline.sampleCount, 0);
    const maxQueueMs = Math.max(0, ...report.runs.map((r) => r.timeline.queueMax));
    console.log(`  rate-limited runs detected    : ${rateLimited > 0 ? chalk.yellow(`${rateLimited}/${sampled}`) : chalk.green(`0/${sampled}`)} ${chalk.gray(`(a limited run is re-queued with a >=${RATE_LIMIT_MIN_BACKOFF_MS / 1000}s delay, so its QUEUE >= ${RATE_LIMIT_DETECTION_MS / 1000}s; max QUEUE seen ${(maxQueueMs / 1000).toFixed(1)}s)`)}`);

    if (rateLimited > 0) {
        console.log(chalk.yellow(`  => rate limiter FIRED during the benchmark — ${rateLimited} runs carry the backoff delay. Raise the project cap or lower concurrency.`));
        return;
    }
    console.log(chalk.green(`  => no run shows the backoff signature: the QUEUE times measured here contain zero rate-limiter delay.`));

    const driven = Math.max(0, ...report.runs.map((r) => r.connections));
    if (typeof defaultLimit === 'number' && driven > defaultLimit) {
        console.log(chalk.yellow(`  => caution for REAL projects: this load ran at concurrency ${driven}, above the ${defaultLimit}-job default cap — a real project under the same load would throttle (+${RATE_LIMIT_MIN_BACKOFF_MS / 1000}s per rejected run).`));
    } else if (typeof defaultLimit === 'number') {
        console.log(chalk.gray(`  => real projects capped at ${defaultLimit} concurrent jobs would sustain this load (driven concurrency ${driven}).`));
    }
}

// One diagnostics reading is a die-roll; the timeline shows whether a bad number (say a 455ms
// storage probe) is the norm or a blip, and whether infra latency degrades under the load phases.
function renderDiagnosticsTimeline(report: BenchmarkReport): void {
    const { intervalMs, samples } = report.diagnosticsTimeline;
    const entries = Object.entries(samples);
    if (entries.length === 0) return;
    console.log(chalk.bold(`\nDiagnostics over time (server-probed every ${intervalMs / 1000}s across the benchmark)`));
    console.log(chalk.gray('  time      db     redis  storage  app cpu%          evloop ms      worker ping p50/max  app steal/thr%'));
    for (const [at, s] of entries) {
        const time = at.slice(11, 19);
        const appsCpu = s.apps.map((a) => a.cpuUsagePercentage.toFixed(0)).join('/') || 'n/a';
        const appsLoop = s.apps.map((a) => a.eventLoopDelayMs).join('/') || 'n/a';
        const ping = s.workerPingP50Ms === null ? 'n/a' : `${s.workerPingP50Ms}/${s.workerPingMaxMs}ms`;
        const pct = (v: number | undefined | null) => (typeof v === 'number' ? v.toFixed(1) : '-');
        const appsPressure = s.apps.map((a) => `${pct(a.cpuStealPercentage)}/${pct(a.cpuThrottledPercentage)}`).join(' ') || 'n/a';
        console.log(`  ${time}  ${String(s.databaseMs ?? 'n/a').padEnd(5)}  ${String(s.redisMs ?? 'n/a').padEnd(5)}  ${String(s.storageMs ?? 'n/a').padEnd(7)}  ${appsCpu.padEnd(16)}  ${appsLoop.padEnd(13)}  ${ping.padEnd(19)}  ${appsPressure}`);
    }
    console.log(chalk.gray('  app cpu/evloop and worker pings refresh on their ~60s ticks, so consecutive rows can repeat them; db/redis/storage are probed fresh each sample.'));
}

// Answers "was anything else running while I benchmarked?" — outside flows share the execution
// slots, so each entry here is workload that inflated QUEUE without any config flag explaining it.
function renderOutsideFlows(report: BenchmarkReport): void {
    console.log(chalk.bold('\nOutside flows (ran during the benchmark, NOT part of it)'));
    const { available, flows, detail } = report.outsideFlows;
    if (!available) {
        console.log(chalk.gray(`  ${detail ?? 'unavailable'}`));
        return;
    }
    if (flows.length === 0) {
        console.log(chalk.green('  none — no other flow ran during the benchmark window. QUEUE times are contention-free.'));
        return;
    }
    console.log(chalk.yellow(`  ${flows.length} flow(s) competed for the execution slots during the load — their runs inflate QUEUE:`));
    for (const flow of flows) {
        const avgRun = flow.avgRunMs === null ? 'n/a' : `${flow.avgRunMs} ms`;
        console.log(`  - ${flow.displayName ?? flow.flowId}: ${flow.runs} runs, avg run ${avgRun}`);
        console.log(chalk.gray(`      flow ${flow.flowId}  project ${flow.projectId}  pieces [${flow.pieces.join(', ') || 'unknown'}]`));
    }
    console.log(chalk.gray(`  window starts ${CLOCK_SKEW_BUFFER_MS / 60_000} min before the load (clock-skew tolerance), so slightly-earlier runs can appear.`));
    if (detail) console.log(chalk.gray(`  note: ${detail}`));
}

function cpuPressureLabel(instance: CpuPressureInfo): string {
    if (instance.cpuStealPercentage === undefined && instance.cpuThrottledPercentage === undefined) return '';
    const steal = instance.cpuStealPercentage;
    const throttled = instance.cpuThrottledPercentage;
    const stealText = steal === undefined ? '' : ` | steal ${steal >= CPU_STEAL_WARN_PCT ? chalk.yellow(`${steal.toFixed(1)}%`) : `${steal.toFixed(1)}%`}`;
    const throttledText = throttled === undefined ? '' : ` | throttled ${throttled >= CPU_THROTTLE_WARN_PCT ? chalk.yellow(`${throttled.toFixed(1)}%`) : `${throttled.toFixed(1)}%`}`;
    return stealText + throttledText;
}

// Both signals are latency the CPU-usage numbers cannot show: steal is the hypervisor running a
// NEIGHBOR tenant while our vCPU was runnable (shared-CPU node types, e.g. GCE E2); throttled is
// our own k8s CPU limit stalling the container in ~100ms CFS quanta. Either one inflates every
// app touch inside QUEUE and RUN while cpu% still looks idle. App-only: workers don't report these.
function renderCpuPressureVerdict(d: DiagnosticsInfo): void {
    const instances: CpuPressureInfo[] = d.apps?.instances ?? [];
    const steals = instances.map((i) => i.cpuStealPercentage).filter((v): v is number => v !== undefined);
    const throttles = instances.map((i) => i.cpuThrottledPercentage).filter((v): v is number => v !== undefined);
    if (steals.length === 0 && throttles.length === 0) return;
    const maxSteal = Math.max(0, ...steals);
    const maxThrottled = Math.max(0, ...throttles);
    if (maxSteal >= CPU_STEAL_WARN_PCT) {
        console.log(chalk.yellow(`  !! CPU steal up to ${maxSteal.toFixed(1)}% — the hypervisor is running OTHER tenants on this node's physical cores (shared-CPU machine types, e.g. GCE E2). This adds latency that cpu%% cannot show; move the app (and redis, if co-located) to dedicated-CPU nodes.`));
    }
    if (maxThrottled >= CPU_THROTTLE_WARN_PCT) {
        console.log(chalk.yellow(`  !! CFS throttling up to ${maxThrottled.toFixed(1)}% of periods — a container keeps hitting its k8s CPU limit and stalls in ~100ms quanta. Raise (or remove) the CPU limit on the affected pods.`));
    }
    if (maxSteal < CPU_STEAL_WARN_PCT && maxThrottled < CPU_THROTTLE_WARN_PCT) {
        console.log(chalk.green(`  cpu pressure ok: steal max ${maxSteal.toFixed(1)}%, throttled max ${maxThrottled.toFixed(1)}% — no neighbor contention or limit throttling detected`));
    }
}

function hb(v: boolean | null | undefined): string {
    if (v === null || v === undefined) return chalk.gray('n/a');
    return v ? chalk.green('ok') : chalk.yellow('warn');
}

function infra(check: InfraCheckInfo | undefined): string {
    if (!check) return chalk.gray('n/a');
    if (!check.ok) return chalk.yellow(`FAIL${check.detail ? ` — ${check.detail}` : ''}`);
    const latency = check.latencyMs === null || check.latencyMs === undefined ? (check.detail ?? 'ok') : `${check.latencyMs} ms`;
    return chalk.green(latency);
}

function formatOutcomes(outcomes: RunOutcomes): string {
    const entries = Object.entries(outcomes);
    if (entries.length === 0) return 'none recorded';
    return entries.map(([status, count]) => `${count} ${status}`).join(', ');
}

function verdict(t: TimelineAggregate): string {
    if (t.serviceP50 <= 0) return chalk.gray('verdict: insufficient data');
    const ratio = t.queueWaitP50 / t.serviceP50;
    if (ratio > 1) {
        return chalk.yellow(`verdict: queue-bound — waiting ${ratio.toFixed(1)}x longer than it runs. Add worker slots or lower concurrency, not a code fix.`);
    }
    return chalk.green('verdict: service-bound — queue-wait is small; latency is real engine time.');
}

function optionalPositiveInt(value: string | boolean | undefined, flag: string): number | undefined {
    if (value === undefined) return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`${flag} must be a positive integer, got "${value}"`);
    }
    return n;
}

function parseSlot(value: string | undefined): number {
    const n = Number.parseInt(value ?? '1', 10);
    return Number.isInteger(n) && n > 0 ? n : 1;
}

function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    // Nearest-rank: rank = ceil(p/100 * N), 1-based. Avoids the floor()-based right bias that
    // returned the max as the "p50" of a 2-element sample.
    const rank = Math.ceil((p / 100) * sorted.length);
    const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
    return sorted[idx];
}

function unique(values: string[]): string[] {
    return [...new Set(values)];
}

function fmt(ms: number): string {
    return ms.toFixed(0);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(config: BenchmarkConfig, message: string): void {
    if (!config.json) console.error(chalk.gray(message));
}

const WEBHOOK_PIECE = '@activepieces/piece-webhook';
const DATA_MAPPER_PIECE = '@activepieces/piece-data-mapper';
const DEFAULT_CONCURRENCY = 10;
const EPHEMERAL_PROJECT_MAX_CONCURRENCY = 1000;
const NETWORK_PROBES = 20;
const RUN_PAGE_SIZE = 100;
const MAX_RUN_PAGES = 30;
const BYTES_PER_GB = 1024 * 1024 * 1024;
const RECOMMENDED_MAX_CPU_CORES = 0.5;
const RECOMMENDED_MAX_RAM_GB = 1;
const QUEUE_SAMPLE_INTERVAL_MS = 500;
const DIAGNOSTICS_SAMPLE_INTERVAL_MS = 5_000;
const CLOCK_SKEW_BUFFER_MS = 5 * 60 * 1000;
const PROJECT_PAGE_SIZE = 100;
const MAX_OUTSIDE_RUN_PAGES = 5;
const MAX_OUTSIDE_FLOWS_DETAILED = 20;
// The server's rate-limiter re-queues a rejected job with min(600s, 20s * 2^attempts) delay
// (rate-limiter-interceptor.ts). 15s = one backoff minus clock-skew tolerance.
const RATE_LIMIT_MIN_BACKOFF_MS = 20_000;
const RATE_LIMIT_DETECTION_MS = 15_000;
// Steal above a few percent means real neighbor contention; healthy dedicated nodes sit at ~0.
// Throttling on a well-sized limit should be rare — a fifth of periods stalled is a sizing problem.
const CPU_STEAL_WARN_PCT = 5;
const CPU_THROTTLE_WARN_PCT = 20;
// Flags that matter for a perf triage — edition, version, execution mode, resource limits, and the
// two throttles (project concurrency cap + rate limiter) that silently cap throughput and emit 429s.
const DIAGNOSTIC_FLAGS = [
    'EDITION', 'CURRENT_VERSION', 'ENVIRONMENT', 'PUBLIC_URL', 'PIECES_SYNC_MODE',
    'FLOW_RUN_TIME_SECONDS', 'TRIGGER_TIMEOUT_SECONDS', 'WEBHOOK_TIMEOUT_SECONDS',
    'FLOW_RUN_MEMORY_LIMIT_KB', 'FLOW_RUN_LOG_SIZE_LIMIT_MB', 'ALLOW_NPM_PACKAGES_IN_CODE_STEP',
    'DEFAULT_CONCURRENT_JOBS_LIMIT', 'PROJECT_RATE_LIMITER_ENABLED', 'EXECUTION_DATA_RETENTION_DAYS',
];

export const benchmarkUtils = { normalizeOptions, toSummary, resolvePhases, validateSetup, aggregateTimeline, percentile, aggregateOutsideRuns };

type BenchmarkConfig = {
    url: string;
    requests?: number;
    concurrency?: number;
    apiKey?: string;
    body: string;
    json: boolean;
};

type AuthResult = { token: string };

type ResolvedProject = { id: string };
type CollectProjectLimitsParams = { client: AxiosInstance; projectId: string; rateLimiterEnabled: boolean };
type ProjectLimits =
    | { available: false; reason: string }
    | { available: true; maxConcurrentJobs: number | null; rateLimiterEnabled: boolean };

type Phase = { label: string; connections: number };

type ResolvePhasesParams = { concurrency?: number; slots?: number };

type CheckStatus = 'PASS' | 'WARN';
type SetupCheck = { dimension: string; status: CheckStatus; detail: string };

type WorkerProps = { EXECUTION_MODE?: string; WORKER_CONCURRENCY?: string; REUSE_SANDBOX?: string; version?: string };
type WorkerMachineWithStatus = {
    status: string;
    information: {
        workerProps: WorkerProps;
        totalCpuCores: number;
        totalAvailableRamInBytes: number;
        cpuUsagePercentage?: number;
        ramUsagePercentage?: number;
        sandboxes?: unknown[];
    };
};

type SetupDiscovery = {
    available: boolean;
    reason?: string;
    machines: WorkerMachineWithStatus[];
    executionSlots?: number;
    checks: SetupCheck[];
};

type NetworkBaseline = { probes: number; minMs: number; p50Ms: number };

type TimelinePhaseName = 'QUEUE' | 'PROVISION' | 'BOOT' | 'RUN';
type FlowRunLike = {
    logsFileId?: string | null;
    status?: string;
    timeline?: { legs?: Array<Array<{ name: TimelinePhaseName; durationMs: number }>> } | null;
};

type TimelineAggregate = {
    sampleCount: number;
    queueWaitP50: number;
    queueWaitP90: number;
    serviceP50: number;
    serviceP90: number;
    queueP50: number;
    queueP90: number;
    queueMax: number;
    provisionP50: number;
    bootP50: number;
    rateLimitedRunsCount: number;
};

type StorageProbe = {
    logsPersisted: number;
    sampled: number;
    detail: string;
};

type CollectRunsParams = { client: AxiosInstance; projectId: string; flowId: string; since: string };
type RunOutcomes = Record<string, number>;
type CollectedRuns = { timeline: TimelineAggregate; outcomes: RunOutcomes };
type ProbeStorageParams = { client: AxiosInstance; projectId: string; flowId: string };

type QueueSample = { waiting: number; active: number };
type OutsideRunLike = { flowId?: string; projectId: string; startTime?: string; finishTime?: string };
type OutsideFlowAggregate = { flowId: string; projectId: string; runs: number; avgRunMs: number | null };
type FlowDescription = { displayName: string | null; pieces: string[] };
type OutsideFlow = OutsideFlowAggregate & FlowDescription;
type OutsideFlowsReport = { available: boolean; detail?: string; flows: OutsideFlow[] };
type CollectOutsideFlowsParams = { client: AxiosInstance; benchmarkProjectId: string; since: string };
type DescribeFlowParams = { client: AxiosInstance; flowId: string; projectId: string };
type QueueDepth = { samples: number; available: boolean; maxWaiting?: number; maxActive?: number; avgWaiting?: number };
type QueueSampler = { stop: () => QueueDepth };
type DiagnosticsSample = {
    databaseMs: number | null;
    redisMs: number | null;
    storageMs: number | null;
    apps: Array<{ hostname: string; cpuUsagePercentage: number; eventLoopDelayMs: number } & CpuPressureInfo>;
    workerPingP50Ms: number | null;
    workerPingMaxMs: number | null;
};
type DiagnosticsTimeline = { intervalMs: number; samples: Record<string, DiagnosticsSample> };
type DiagnosticsSampler = { stop: () => Record<string, DiagnosticsSample> };

type HealthInfo = {
    available: boolean;
    reason?: string;
    latestVersion?: string;
    appCpu?: boolean;
    appRam?: boolean;
    disk?: boolean;
    workerCpu?: boolean | null;
    workerRam?: boolean | null;
    database?: boolean;
    release?: { current: string; workers: { total: number; versionMismatched: number; mismatchedVersions: string[] } };
};

type RunMeta = {
    ranAt: string;
    target: string;
    cli: { node: string; platform: string; cpus: number; note: string };
};

type InfraCheckInfo = { ok: boolean; latencyMs: number | null; detail?: string };
type DiagnosticsInfo = {
    available: boolean;
    reason?: string;
    database?: InfraCheckInfo;
    redis?: InfraCheckInfo;
    storage?: InfraCheckInfo;
    config?: {
        executionMode: string | null;
        fileStorageLocation: string | null;
        sandboxMemoryLimitKb: number | null;
        s3SignedUrls: boolean | null;
        s3Endpoint: string | null;
        s3Region: string | null;
        projectRateLimiterEnabled?: boolean | null;
        defaultConcurrentJobsLimit?: number | null;
    };
    apps?: {
        count: number;
        instances: Array<{ hostname: string; version: string; cpuCores: number; cpuUsagePercentage: number; ramTotalBytes: number; ramUsagePercentage: number; diskPercentage: number; eventLoopDelayMs: number } & CpuPressureInfo>;
    };
    workers?: {
        count: number;
        machines: Array<{ workerId: string; cpuCores: number; cpuUsagePercentage: number; ramUsagePercentage: number; serverPingMs: number | null; status: string }>;
    };
};

type CpuPressureInfo = { cpuStealPercentage?: number; cpuThrottledPercentage?: number };

type LoadResult = {
    requests: { sent: number; average: number };
    latency: { mean: number; p50: number; p90: number; p99: number; min: number; max: number };
    duration: number;
    '1xx'?: number;
    '2xx': number;
    '3xx'?: number;
    '4xx'?: number;
    '5xx'?: number;
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
    statusCodes: { '1xx': number; '2xx': number; '3xx': number; '4xx': number; '5xx': number };
    errors: number;
    timeouts: number;
    failed: number;
};

type PhaseReport = {
    label: string;
    connections: number;
    requests: number;
    startedAt: string;
    summary: Summary;
    timeline: TimelineAggregate;
    outcomes: RunOutcomes;
    queueDepth: QueueDepth;
};

type BenchmarkReport = {
    meta: RunMeta;
    flowId: string;
    project: { id: string; limits: ProjectLimits };
    health: HealthInfo;
    diagnostics: DiagnosticsInfo;
    diagnosticsTimeline: DiagnosticsTimeline;
    setup: SetupDiscovery;
    flags: Record<string, unknown>;
    network: NetworkBaseline;
    storage: StorageProbe;
    outsideFlows: OutsideFlowsReport;
    runs: PhaseReport[];
};
