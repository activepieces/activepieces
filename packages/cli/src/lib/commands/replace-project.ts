import {
    ConnectionState,
    FlowState,
    flowStructureUtil,
    Folder,
    PieceType,
    PROJECT_REPLACE_SCHEMA_VERSION,
    ProjectReplaceRequest,
    ProjectReplaceResponse,
    RequiredPiece,
    SeekPage,
    TableState,
} from '@activepieces/shared';
import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';

const REPLACE_DOC = 'Replace a destination Activepieces project with the source project state (flows, tables, folders).';

const EXIT_OK = 0;
const EXIT_PARTIAL = 1;
const EXIT_PREFLIGHT = 2;
const EXIT_SERVER = 3;
const EXIT_TRANSPORT = 4;

export const replaceProjectCommand = new Command('replace')
    .description(REPLACE_DOC)
    .requiredOption('--source-url <url>', 'Source Activepieces base URL')
    .option('--source-token <token>', 'Source platform API token (or set AP_SOURCE_TOKEN env var; env recommended for CI)')
    .requiredOption('--source-project <projectId>', 'Source project id')
    .requiredOption('--dest-url <url>', 'Destination Activepieces base URL')
    .option('--dest-token <token>', 'Destination platform API token (or set AP_DEST_TOKEN env var; env recommended for CI)')
    .requiredOption('--dest-project <projectId>', 'Destination project id')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (opts) => {
        const config: ReplaceConfig = normalizeOptions(opts);

        try {
            const sourceState = await fetchSourceState(config);
            const request: ProjectReplaceRequest = {
                schemaVersion: PROJECT_REPLACE_SCHEMA_VERSION,
                sourceActivepiecesVersion: sourceState.version,
                flows: sourceState.flows,
                tables: sourceState.tables,
                folders: sourceState.folders,
                connections: sourceState.connections,
                requiredPieces: sourceState.requiredPieces,
            };
            const result = await postReplace(config, request);
            handleSuccess(config, result);
        } catch (e) {
            handleFailure(config, e);
        }
    });

function normalizeOptions(opts: Record<string, string | boolean | undefined>): ReplaceConfig {
    return {
        sourceUrl: stripTrailingSlash(stringOpt(opts.sourceUrl, 'source-url')),
        sourceToken: tokenOpt(opts.sourceToken, 'AP_SOURCE_TOKEN', 'source-token'),
        sourceProjectId: stringOpt(opts.sourceProject, 'source-project'),
        destUrl: stripTrailingSlash(stringOpt(opts.destUrl, 'dest-url')),
        destToken: tokenOpt(opts.destToken, 'AP_DEST_TOKEN', 'dest-token'),
        destProjectId: stringOpt(opts.destProject, 'dest-project'),
        json: opts.json === true,
    };
}

function stringOpt(value: string | boolean | undefined, name: string): string {
    if (typeof value !== 'string') {
        throw new Error(`Missing required option --${name}`);
    }
    return value;
}

function tokenOpt(value: string | boolean | undefined, envName: string, flagName: string): string {
    if (typeof value === 'string' && value.length > 0) {
        return value;
    }
    const fromEnv = process.env[envName];
    if (typeof fromEnv === 'string' && fromEnv.length > 0) {
        return fromEnv;
    }
    throw new Error(`Missing API token: pass --${flagName} <token> or set ${envName} environment variable. ${envName} is recommended for CI to keep tokens out of process arguments and shell history.`);
}

function stripTrailingSlash(url: string): string {
    return url.endsWith('/') ? url.slice(0, -1) : url;
}

async function fetchSourceState(config: ReplaceConfig): Promise<SourceState> {
    const client = axios.create({
        baseURL: config.sourceUrl,
        headers: { Authorization: `Bearer ${config.sourceToken}` },
    });

    const [versionRes, flowsPage, foldersPage, tablesPage, connectionsPage] = await Promise.all([
        client.get<{ version: string }>('/api/v1/flags').then((r) => parseVersion(r.data)),
        listAll<FlowState>(client, '/api/v1/flows', { projectId: config.sourceProjectId }),
        listAll<Folder>(client, '/api/v1/folders', { projectId: config.sourceProjectId }),
        listAll<TableState & { projectId: string }>(client, '/api/v1/tables', { projectId: config.sourceProjectId }),
        listAll<{ externalId: string; pieceName: string; displayName: string }>(client, '/api/v1/app-connections', { projectId: config.sourceProjectId }),
    ]);

    const tableStates: TableState[] = await Promise.all(
        tablesPage.map(async (table) => {
            const fields = await client
                .get(`/api/v1/fields`, { params: { tableId: table.id } })
                .then((r) => r.data as Array<{ name: string; type: string; externalId: string; data?: { options: Array<{ value: string }> } | null }>);
            return {
                id: table.id,
                externalId: table.externalId ?? table.id,
                name: table.name,
                fields: fields.map((field) => ({
                    name: field.name,
                    type: field.type,
                    externalId: field.externalId,
                    data: field.data ?? null,
                })),
                status: null,
                trigger: null,
            };
        }),
    );

    const folderStates = foldersPage
        .filter((folder) => folder.externalId)
        .map((folder) => ({
            externalId: folder.externalId as string,
            displayName: folder.displayName,
            displayOrder: folder.displayOrder,
        }));

    const requiredPieces = collectRequiredPieces(flowsPage);

    const connections: ConnectionState[] = connectionsPage.map((c) => ({
        externalId: c.externalId,
        pieceName: c.pieceName,
        displayName: c.displayName,
    }));

    return {
        version: versionRes,
        flows: flowsPage,
        tables: tableStates,
        folders: folderStates,
        connections,
        requiredPieces,
    };
}

async function listAll<T>(client: ReturnType<typeof axios.create>, path: string, params: Record<string, string>): Promise<T[]> {
    const items: T[] = [];
    let cursor: string | undefined;
    while (true) {
        const res = await client.get<SeekPage<T>>(path, {
            params: { ...params, cursor, limit: 100 },
        });
        items.push(...res.data.data);
        if (!res.data.next) break;
        cursor = res.data.next;
    }
    return items;
}

function parseVersion(flags: unknown): string {
    if (typeof flags !== 'object' || flags === null) {
        return '0.0.0';
    }
    const record = flags as Record<string, unknown>;
    const version = record['CURRENT_VERSION'] ?? record['version'];
    return typeof version === 'string' ? version : '0.0.0';
}

function collectRequiredPieces(flows: FlowState[]): RequiredPiece[] {
    const map = new Map<string, RequiredPiece>();
    for (const flow of flows) {
        for (const step of flowStructureUtil.getAllSteps(flow.version.trigger)) {
            const settings = step.settings as { pieceName?: string; pieceVersion?: string; pieceType?: PieceType } | undefined;
            const name = settings?.pieceName;
            const version = settings?.pieceVersion;
            if (!name || !version) continue;
            const key = `${name}@${version}`;
            if (map.has(key)) continue;
            map.set(key, {
                name,
                version,
                pieceType: settings?.pieceType ?? PieceType.OFFICIAL,
            });
        }
    }
    return Array.from(map.values());
}

async function postReplace(config: ReplaceConfig, request: ProjectReplaceRequest): Promise<ReplaceResult> {
    const client = axios.create({
        baseURL: config.destUrl,
        headers: { Authorization: `Bearer ${config.destToken}` },
        validateStatus: () => true,
    });
    const response = await client.post<unknown>(
        `/api/v1/projects/${encodeURIComponent(config.destProjectId)}/replace`,
        request,
    );
    return {
        status: response.status,
        body: response.data,
    };
}

function handleSuccess(config: ReplaceConfig, result: ReplaceResult): void {
    if (result.status === 200 || result.status === 207) {
        const body = result.body as ProjectReplaceResponse;
        if (config.json) {
            process.stdout.write(JSON.stringify(body, null, 2) + '\n');
        } else {
            renderApplied(body);
        }
        process.exit(result.status === 200 ? EXIT_OK : EXIT_PARTIAL);
    }
    if (result.status === 409) {
        if (config.json) {
            process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
        } else {
            console.error(chalk.yellow('Replace already in progress on the destination project. Retry shortly.'));
        }
        process.exit(EXIT_SERVER);
    }
    if (result.status === 422) {
        if (config.json) {
            process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
        } else {
            renderPreflightErrors(result.body);
        }
        process.exit(EXIT_PREFLIGHT);
    }
    if (result.status === 502) {
        if (config.json) {
            process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
        } else {
            renderInstallFailures(result.body);
        }
        process.exit(EXIT_SERVER);
    }
    if (result.status >= 500) {
        if (config.json) {
            process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
        } else {
            console.error(chalk.red(`Destination server error (${result.status}).`));
        }
        process.exit(EXIT_SERVER);
    }
    if (config.json) {
        process.stdout.write(JSON.stringify(result.body, null, 2) + '\n');
    } else {
        console.error(chalk.red(`Unexpected response (${result.status}).`));
    }
    process.exit(EXIT_SERVER);
}

function renderApplied(body: ProjectReplaceResponse): void {
    const a = body.applied;
    console.log(chalk.bold(`Replace finished in ${body.durationMs}ms`));
    console.log(`  pieces      : ${body.piecesInstalled.length} installed`);
    console.log(`  flows       : ${a.flowsCreated} created, ${a.flowsUpdated} updated, ${a.flowsDeleted} deleted, ${a.flowsUnchanged} unchanged`);
    console.log(`  tables      : ${a.tablesCreated} created, ${a.tablesUpdated} updated, ${a.tablesDeleted} deleted, ${a.tablesUnchanged} unchanged`);
    console.log(`  folders     : ${a.foldersCreated} created, ${a.foldersUpdated} updated, ${a.foldersDeleted} deleted, ${a.foldersUnchanged} unchanged`);
    console.log(`  connections : ${a.connectionsCreated} created, ${a.connectionsUpdated} updated, ${a.connectionsUnchanged} unchanged`);
    if (body.piecesInstalled.length > 0) {
        console.log(chalk.cyan(`\n${body.piecesInstalled.length} piece(s) installed on destination:`));
        for (const p of body.piecesInstalled) {
            console.log(`  - ${p.name}@${p.version} (${p.pieceType})`);
        }
    }
    if (body.failed.length > 0) {
        console.log(chalk.yellow(`\n${body.failed.length} item(s) failed:`));
        for (const f of body.failed) {
            console.log(`  - ${f.kind} ${f.externalId} (${f.op}): ${f.error}`);
        }
    }
    if (body.connectionsAwaitingAuthorization.length > 0) {
        console.log(chalk.yellow(`\n${body.connectionsAwaitingAuthorization.length} connection(s) need authorization on destination before flows can run:`));
        for (const c of body.connectionsAwaitingAuthorization) {
            console.log(`  - ${c.displayName} (${c.pieceName}) [externalId=${c.externalId}]`);
        }
    }
}

function renderPreflightErrors(body: unknown): void {
    console.error(chalk.red('Preflight failed. No writes were performed.'));
    if (typeof body === 'object' && body !== null && 'errors' in body) {
        const errors = (body as { errors: Array<{ kind: string }> }).errors;
        for (const err of errors) {
            console.error(`  - ${JSON.stringify(err)}`);
        }
    }
}

function renderInstallFailures(body: unknown): void {
    console.error(chalk.red('Piece install failed on destination. No flows, tables, folders, or connections were touched.'));
    if (typeof body === 'object' && body !== null && 'failures' in body) {
        const failures = (body as { failures: Array<{ pieceName: string; version: string; pieceType: string; message: string }> }).failures;
        for (const f of failures) {
            console.error(`  - ${f.pieceName}@${f.version} (${f.pieceType}): ${f.message}`);
        }
    }
}

function handleFailure(config: ReplaceConfig, e: unknown): void {
    if (e instanceof AxiosError) {
        if (config.json) {
            process.stdout.write(JSON.stringify({ error: e.message, code: e.code }) + '\n');
        } else {
            console.error(chalk.red(`Transport error: ${e.message}`));
        }
        process.exit(EXIT_TRANSPORT);
    }
    if (config.json) {
        process.stdout.write(JSON.stringify({ error: String(e) }) + '\n');
    } else {
        console.error(chalk.red(`Error: ${e instanceof Error ? e.message : String(e)}`));
    }
    process.exit(EXIT_TRANSPORT);
}

type ReplaceConfig = {
    sourceUrl: string;
    sourceToken: string;
    sourceProjectId: string;
    destUrl: string;
    destToken: string;
    destProjectId: string;
    json: boolean;
};

type SourceState = {
    version: string;
    flows: FlowState[];
    tables: TableState[];
    folders: Array<{ externalId: string; displayName: string; displayOrder: number }>;
    connections: ConnectionState[];
    requiredPieces: RequiredPiece[];
};

type ReplaceResult = {
    status: number;
    body: unknown;
};
