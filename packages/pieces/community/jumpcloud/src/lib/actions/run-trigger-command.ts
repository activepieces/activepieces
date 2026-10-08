import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jumpcloudAuth } from '../auth';
import { COMMAND_MAX_WAIT_SECONDS, COMMAND_POLL_SECONDS, jumpcloudApi } from '../common/client';
import { jumpcloudOutput } from '../common/output';
import { ConnectionProps, FlatObject } from '../common/types';
import { runCommandOutputSchema } from '../output-schemas';

export const runTriggerCommandAction = createAction({
    auth: jumpcloudAuth,
    name: 'run_trigger_command',
    classification: 'WRITE',
    displayName: 'Run Trigger Command',
    description: 'Run the JumpCloud commands launched by a trigger name, and optionally wait for their results.',
    audience: 'both',
    aiMetadata: {
        description:
            'Launches every JumpCloud command whose launch event is "Run on Trigger" with the given trigger name, passing optional JSON variables, and returns the launched command IDs; with Wait For Results it also returns each device result (exit code, output) reported within the wait time. Each call runs the commands again on their devices.',
        idempotent: false,
    },
    props: {
        instructions: Property.MarkDown({
            value: `In the JumpCloud Admin Portal, open **Device Management > Commands**, edit the command, set **Launch Event** to **Run on Trigger (webhook)** and enter a **Trigger Name**. Use that name below.`,
        }),
        triggerName: Property.ShortText({
            displayName: 'Trigger Name',
            description: 'The Trigger Name set on the command in JumpCloud. Every command with this name runs.',
            required: true,
        }),
        variables: Property.Json({
            displayName: 'Variables',
            description: 'Optional JSON object passed to the command. JumpCloud exposes each key to the script as an environment variable.',
            required: false,
        }),
        waitForResults: Property.Checkbox({
            displayName: 'Wait For Results',
            description: 'Wait until each command reports a result, up to the time below.',
            required: false,
            defaultValue: false,
            reveals: ['waitSeconds'],
        }),
        waitSeconds: Property.Number({
            displayName: 'Max Wait (seconds)',
            description: `How long to wait for results, from ${COMMAND_POLL_SECONDS} to ${COMMAND_MAX_WAIT_SECONDS} seconds. Devices that are offline report later.`,
            required: false,
            defaultValue: 60,
        }),
    },
    outputSchema: runCommandOutputSchema,
    async run(context) {
        const auth = context.auth.props;
        const triggerName = context.propsValue.triggerName.trim();
        if (triggerName.length === 0) {
            throw new Error('Enter the Trigger Name of the command.');
        }
        const waitMs = context.propsValue.waitForResults === true ? validateWait(context.propsValue.waitSeconds) * 1000 : 0;
        const launchedAt = Date.now() - CLOCK_SKEW_MS;
        const response = await jumpcloudApi.send<unknown>({
            auth,
            method: HttpMethod.POST,
            path: `/command/trigger/${encodeURIComponent(triggerName)}`,
            body: context.propsValue.variables ?? {},
        });
        const commandIds = readTriggered(response);
        if (commandIds.length === 0) {
            throw new Error(
                `No JumpCloud command uses the trigger name "${triggerName}". Set the command's Launch Event to Run on Trigger (webhook) with this Trigger Name.`,
            );
        }
        if (context.propsValue.waitForResults !== true) {
            return { trigger_name: triggerName, command_ids: commandIds, waited: false, completed: false, results: [] };
        }
        const targets = await Promise.all(commandIds.map(async (commandId) => ({ commandId, systemIds: await fetchTargetSystems({ auth, commandId, skip: 0 }) })));
        const deadline = Date.now() + waitMs;
        const results = await waitForResults({ auth, targets, launchedAt, deadline });
        return {
            trigger_name: triggerName,
            command_ids: commandIds,
            waited: true,
            completed: allReported({ targets, results }),
            results,
        };
    },
});

async function waitForResults({ auth, targets, launchedAt, deadline }: WaitParams): Promise<FlatObject[]> {
    const lists = await Promise.all(targets.map(({ commandId }) => fetchResults({ auth, commandId, launchedAt })));
    const results = lists.flat();
    if (allReported({ targets, results }) || Date.now() + COMMAND_POLL_SECONDS * 1000 > deadline) {
        return results;
    }
    await sleep(COMMAND_POLL_SECONDS * 1000);
    return waitForResults({ auth, targets, launchedAt, deadline });
}

function allReported({ targets, results }: { targets: CommandTargets[]; results: FlatObject[] }): boolean {
    return targets.every(({ commandId, systemIds }) => {
        const reported = new Set(results.filter((result) => result['command_id'] === commandId).map((result) => result['system_id']));
        return systemIds.length === 0 ? reported.size > 0 : systemIds.every((systemId) => reported.has(systemId));
    });
}

async function fetchTargetSystems({ auth, commandId, skip }: { auth: ConnectionProps; commandId: string; skip: number }): Promise<string[]> {
    const body = await jumpcloudApi.send<unknown>({
        auth,
        method: HttpMethod.GET,
        path: `/commands/${encodeURIComponent(commandId)}/systems`,
        version: 'v2',
        queryParams: { limit: String(TARGET_PAGE_SIZE), skip: String(skip) },
    });
    const page = Array.isArray(body) ? body.filter(jumpcloudApi.isRecord) : [];
    const ids = page.flatMap((record) => (typeof record['id'] === 'string' && record['id'].length > 0 ? [record['id']] : []));
    if (page.length < TARGET_PAGE_SIZE) {
        return ids;
    }
    return [...ids, ...(await fetchTargetSystems({ auth, commandId, skip: skip + page.length }))];
}

async function fetchResults({ auth, commandId, launchedAt }: { auth: ConnectionProps; commandId: string; launchedAt: number }): Promise<FlatObject[]> {
    const body = await jumpcloudApi.send<unknown>({
        auth,
        method: HttpMethod.GET,
        path: `/commands/${encodeURIComponent(commandId)}/results`,
    });
    const records = Array.isArray(body) ? body.filter(jumpcloudApi.isRecord) : [];
    return records
        .filter((record) => {
            const requested = typeof record['requestTime'] === 'string' ? Date.parse(record['requestTime']) : Number.NaN;
            return Number.isFinite(requested) && requested >= launchedAt;
        })
        .map((record) => jumpcloudOutput.flattenCommandResult({ commandId, record }));
}

function readTriggered(body: unknown): string[] {
    if (!jumpcloudApi.isRecord(body) || !Array.isArray(body['triggered'])) {
        return [];
    }
    return body['triggered'].filter((id): id is string => typeof id === 'string' && id.length > 0);
}

function validateWait(value: number | undefined): number {
    const seconds = value ?? 60;
    if (!Number.isFinite(seconds) || seconds < COMMAND_POLL_SECONDS || seconds > COMMAND_MAX_WAIT_SECONDS) {
        throw new Error(`Max Wait must be from ${COMMAND_POLL_SECONDS} to ${COMMAND_MAX_WAIT_SECONDS} seconds.`);
    }
    return seconds;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const CLOCK_SKEW_MS = 10_000;
const TARGET_PAGE_SIZE = 100;

type CommandTargets = {
    commandId: string;
    systemIds: string[];
};

type WaitParams = {
    auth: ConnectionProps;
    targets: CommandTargets[];
    launchedAt: number;
    deadline: number;
};
