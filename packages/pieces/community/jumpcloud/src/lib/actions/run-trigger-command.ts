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
        const results = await waitForResults({ auth, commandIds, deadline: Date.now() + waitMs });
        const reported = new Set(results.map((result) => result['command_id']));
        return {
            trigger_name: triggerName,
            command_ids: commandIds,
            waited: true,
            completed: commandIds.every((id) => reported.has(id)),
            results,
        };
    },
});

async function waitForResults({ auth, commandIds, deadline }: { auth: ConnectionProps; commandIds: string[]; deadline: number }): Promise<FlatObject[]> {
    const lists = await Promise.all(commandIds.map((commandId) => fetchResults({ auth, commandId })));
    const results = lists.flat();
    const done = commandIds.every((id) => results.some((result) => result['command_id'] === id));
    if (done || Date.now() + COMMAND_POLL_SECONDS * 1000 > deadline) {
        return results;
    }
    await sleep(COMMAND_POLL_SECONDS * 1000);
    return waitForResults({ auth, commandIds, deadline });
}

async function fetchResults({ auth, commandId }: { auth: ConnectionProps; commandId: string }): Promise<FlatObject[]> {
    const body = await jumpcloudApi.send<unknown>({
        auth,
        method: HttpMethod.GET,
        path: `/commands/${encodeURIComponent(commandId)}/results`,
    });
    const records = Array.isArray(body) ? body.filter(jumpcloudApi.isRecord) : [];
    return records.map((record) => jumpcloudOutput.flattenCommandResult({ commandId, record }));
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
