import { HttpError, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
    AppConnectionType,
    AppConnectionValueForAuthProperty,
    createMockActionContext,
    InputPropertyMap,
    OutputSchema,
    StaticPropsValue,
} from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAssociationAction } from '../src/lib/actions/create-association';
import { deleteAssociationAction } from '../src/lib/actions/delete-association';
import { findUserByEmployeeIdAction } from '../src/lib/actions/find-user-by-employee-id';
import { lockUserAction } from '../src/lib/actions/lock-user';
import { resetUserMfaAction } from '../src/lib/actions/reset-user-mfa';
import { runTriggerCommandAction } from '../src/lib/actions/run-trigger-command';
import { unlockUserAction } from '../src/lib/actions/unlock-user';
import { updateUserOnSystemAction } from '../src/lib/actions/update-user-on-system';
import { jumpcloudAuth } from '../src/lib/auth';
import { jumpcloudAssociations } from '../src/lib/common/associations';
import { ObjectTypeKey } from '../src/lib/common/types';
import {
    associationOutputSchema,
    findUserOutputSchema,
    resetMfaOutputSchema,
    runCommandOutputSchema,
    userOnSystemOutputSchema,
    userOutputSchema,
} from '../src/lib/output-schemas';

const sendRequest = vi.fn();

const V1 = 'https://console.jumpcloud.com/api';
const V2 = 'https://console.jumpcloud.com/api/v2';

beforeEach(() => {
    sendRequest.mockReset();
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => sendRequest(request));
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('association routing', () => {
    it.each(ROUTE_CASES)('routes %s %s', (sourceType, sourceId, targetType, targetId, path, type, id) => {
        expect(jumpcloudAssociations.route({ sourceType, sourceId, targetType, targetId })).toEqual({ path, type, id });
    });

    it('lists the valid targets for an impossible pair', () => {
        expect(() => jumpcloudAssociations.route({ sourceType: 'application', sourceId: 'a1', targetType: 'system', targetId: 's1' })).toThrow(
            'JumpCloud cannot associate a Application (SSO) with a System (device). Pick one of: User, User Group.',
        );
    });
});

describe('Create / Delete Association', () => {
    it('adds group membership through the members endpoint', async () => {
        sendRequest.mockResolvedValue({ status: 204, body: '' });

        const result = await createAssociationAction.run(
            context<typeof createAssociationAction.props>({ objectType: 'user', objectId: ' u1 ', targetType: 'user_group', targetId: 'g1' }),
        );

        expect(lastRequest()).toEqual({
            method: HttpMethod.POST,
            url: `${V2}/usergroups/g1/members`,
            headers: expect.any(Object),
            body: { op: 'add', type: 'user', id: 'u1' },
        });
        expect(result).toEqual({ object_type: 'user', object_id: 'u1', associated_type: 'user_group', associated_id: 'g1', associated: true });
        expectSchemaResolves({ schema: associationOutputSchema, output: result });
    });

    it('removes an application association', async () => {
        sendRequest.mockResolvedValue({ status: 204, body: '' });

        const result = await deleteAssociationAction.run(
            context<typeof deleteAssociationAction.props>({ objectType: 'user', objectId: 'u1', targetType: 'application', targetId: 'a1' }),
        );

        expect(lastRequest()).toMatchObject({ url: `${V2}/users/u1/associations`, body: { op: 'remove', type: 'application', id: 'a1' } });
        expect(result).toMatchObject({ associated: false });
    });

    it('requires both objects', async () => {
        await expect(
            createAssociationAction.run(
                context<typeof createAssociationAction.props>({ objectType: 'user', objectId: 'u1', targetType: 'system', targetId: ' ' }),
            ),
        ).rejects.toThrow('Select both objects');
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('Search User by Employee ID', () => {
    it('returns the matching user', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: 1, results: [{ _id: 'u1', employeeIdentifier: 'E-1' }] } });

        const result = await findUserByEmployeeIdAction.run(context<typeof findUserByEmployeeIdAction.props>({ employeeId: ' E-1 ' }));

        expect(lastRequest()).toMatchObject({
            url: `${V1}/systemusers`,
            queryParams: { limit: '2', skip: '0', sort: '_id', filter: 'employeeIdentifier:$eq:E-1' },
        });
        expect(result).toMatchObject({ found: true, id: 'u1', employee_id: 'E-1' });
        expectSchemaResolves({ schema: findUserOutputSchema, output: result });
    });

    it('returns found=false with empty fields when nobody matches', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { totalCount: 0, results: [] } });

        const result = await findUserByEmployeeIdAction.run(context<typeof findUserByEmployeeIdAction.props>({ employeeId: 'E-9' }));

        expect(result).toMatchObject({ found: false, id: null, email: null });
        expectSchemaResolves({ schema: findUserOutputSchema, output: result });
    });

    it('requires an employee ID', async () => {
        await expect(findUserByEmployeeIdAction.run(context<typeof findUserByEmployeeIdAction.props>({ employeeId: '  ' }))).rejects.toThrow(
            'Enter the Employee ID',
        );
    });
});

describe('Lock / Unlock User', () => {
    it('locks the user and returns it', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { _id: 'u1', account_locked: true } });

        const result = await lockUserAction.run(context<typeof lockUserAction.props>({ userId: 'u1' }));

        expect(lastRequest()).toMatchObject({ method: HttpMethod.PUT, url: `${V1}/systemusers/u1`, body: { account_locked: true } });
        expect(result).toMatchObject({ id: 'u1', account_locked: true });
        expectSchemaResolves({ schema: userOutputSchema, output: result });
    });

    it('unlocks the user and returns its fresh state', async () => {
        sendRequest.mockImplementation(async (request: Request) =>
            request.method === HttpMethod.POST ? { status: 200, body: 'ok' } : { status: 200, body: { _id: 'u1', account_locked: false } },
        );

        const result = await unlockUserAction.run(context<typeof unlockUserAction.props>({ userId: 'u1' }));

        expect(sendRequest.mock.calls.map(([request]) => `${request.method} ${request.url}`)).toEqual([
            `POST ${V1}/systemusers/u1/unlock`,
            `GET ${V1}/systemusers/u1`,
        ]);
        expect(result).toMatchObject({ id: 'u1', account_locked: false });
    });
});

describe('Reset User MFA', () => {
    it('resets without a grace period by default', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: '' });

        const result = await resetUserMfaAction.run(
            context<typeof resetUserMfaAction.props>({ userId: 'u1', allowGracePeriod: false, gracePeriodDays: 7 }),
        );

        expect(lastRequest()).toMatchObject({ url: `${V1}/systemusers/u1/resetmfa`, body: { exclusion: false } });
        expect(result).toEqual({ user_id: 'u1', mfa_reset: true, grace_period_days: null });
        expectSchemaResolves({ schema: resetMfaOutputSchema, output: result });
    });

    it('sends the grace period when allowed', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: '' });

        await resetUserMfaAction.run(context<typeof resetUserMfaAction.props>({ userId: 'u1', allowGracePeriod: true, gracePeriodDays: 3 }));

        expect(lastRequest().body).toEqual({ exclusion: true, exclusionDays: 3 });
    });

    it.each([0, 1.5, 400, undefined])('rejects a grace period of %s days', async (gracePeriodDays) => {
        await expect(
            resetUserMfaAction.run(context<typeof resetUserMfaAction.props>({ userId: 'u1', allowGracePeriod: true, gracePeriodDays })),
        ).rejects.toThrow('Grace Period must be');
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('Update User on System', () => {
    it('updates the sudo attributes of an existing binding', async () => {
        sendRequest.mockResolvedValue({ status: 204, body: '' });

        const result = await updateUserOnSystemAction.run(
            context<typeof updateUserOnSystemAction.props>({
                userId: 'u1',
                systemId: 's1',
                sudoEnabled: true,
                sudoWithoutPassword: true,
                bindIfNeeded: false,
            }),
        );

        expect(lastRequest()).toMatchObject({
            url: `${V2}/users/u1/associations`,
            body: { op: 'update', type: 'system', id: 's1', attributes: { sudo: { enabled: true, withoutPassword: true } } },
        });
        expect(result).toEqual({ user_id: 'u1', system_id: 's1', sudo_enabled: true, sudo_without_password: true });
        expectSchemaResolves({ schema: userOnSystemOutputSchema, output: result });
    });

    it('binds when asked and ignores passwordless sudo without sudo', async () => {
        sendRequest.mockResolvedValue({ status: 204, body: '' });

        await updateUserOnSystemAction.run(
            context<typeof updateUserOnSystemAction.props>({
                userId: 'u1',
                systemId: 's1',
                sudoEnabled: false,
                sudoWithoutPassword: true,
                bindIfNeeded: true,
            }),
        );

        expect(lastRequest().body).toMatchObject({ op: 'add', attributes: { sudo: { enabled: false, withoutPassword: false } } });
    });
});

describe('Run Trigger Command', () => {
    const base = { instructions: undefined, variables: { env: 'prod' }, waitForResults: false, waitSeconds: 60 };

    it('launches the commands and returns their IDs', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { triggered: ['c1', 'c2'] } });

        const result = await runTriggerCommandAction.run(context<typeof runTriggerCommandAction.props>({ ...base, triggerName: ' deploy app ' }));

        expect(lastRequest()).toMatchObject({ method: HttpMethod.POST, url: `${V1}/command/trigger/deploy%20app`, body: { env: 'prod' } });
        expect(result).toEqual({ trigger_name: 'deploy app', command_ids: ['c1', 'c2'], waited: false, completed: false, results: [] });
    });

    it('explains a trigger name that launches nothing', async () => {
        sendRequest.mockResolvedValue({ status: 200, body: { triggered: [] } });

        await expect(
            runTriggerCommandAction.run(context<typeof runTriggerCommandAction.props>({ ...base, triggerName: 'nope' })),
        ).rejects.toThrow('No JumpCloud command uses the trigger name "nope"');
    });

    it('polls until every command reports', async () => {
        vi.useFakeTimers();
        const resultsCalls = { count: 0 };
        sendRequest.mockImplementation(async (request: Request) => {
            if (request.method === HttpMethod.POST) {
                return { status: 200, body: { triggered: ['c1'] } };
            }
            resultsCalls.count += 1;
            return resultsCalls.count < 2
                ? { status: 200, body: [] }
                : {
                      status: 200,
                      body: [{ name: 'Deploy', systemId: 's1', system: 'mac-01', response: { data: { exitCode: 0, output: 'done' }, error: '' } }],
                  };
        });

        const pending = runTriggerCommandAction.run(
            context<typeof runTriggerCommandAction.props>({ ...base, triggerName: 'deploy', waitForResults: true, waitSeconds: 60 }),
        );
        await vi.advanceTimersByTimeAsync(5000);
        const result = await pending;

        expect(resultsCalls.count).toBe(2);
        expect(result).toMatchObject({
            waited: true,
            completed: true,
            results: [{ command_id: 'c1', command_name: 'Deploy', system_id: 's1', system_name: 'mac-01', exit_code: 0, output: 'done', error: null }],
        });
        expectSchemaResolves({ schema: runCommandOutputSchema, output: result });
    });

    it('stops waiting at the deadline', async () => {
        vi.useFakeTimers();
        sendRequest.mockImplementation(async (request: Request) =>
            request.method === HttpMethod.POST ? { status: 200, body: { triggered: ['c1'] } } : { status: 200, body: [] },
        );

        const pending = runTriggerCommandAction.run(
            context<typeof runTriggerCommandAction.props>({ ...base, triggerName: 'deploy', waitForResults: true, waitSeconds: 10 }),
        );
        await vi.advanceTimersByTimeAsync(20000);

        expect(await pending).toMatchObject({ waited: true, completed: false, results: [] });
        expect(sendRequest.mock.calls.filter(([request]) => request.method === HttpMethod.GET)).toHaveLength(3);
    });

    it.each([1, 301])('rejects a wait of %s seconds', async (waitSeconds) => {
        sendRequest.mockResolvedValue({ status: 200, body: { triggered: ['c1'] } });

        await expect(
            runTriggerCommandAction.run(
                context<typeof runTriggerCommandAction.props>({ ...base, triggerName: 'deploy', waitForResults: true, waitSeconds }),
            ),
        ).rejects.toThrow('Max Wait must be from 5 to 300 seconds.');
    });

    it('surfaces API errors', async () => {
        sendRequest.mockRejectedValue(new HttpError({}, { status: 403, responseBody: { message: 'forbidden' } }));

        await expect(
            runTriggerCommandAction.run(context<typeof runTriggerCommandAction.props>({ ...base, triggerName: 'deploy' })),
        ).rejects.toThrow('JumpCloud API error (HTTP 403): forbidden');
    });
});

function expectSchemaResolves({ schema, output }: { schema: OutputSchema; output: unknown }): void {
    expect(output).toBeTypeOf('object');
    schema.fields.forEach((field) => {
        const path = field.value ?? field.key;
        expect(output, `missing output field ${path}`).toHaveProperty([path]);
        const items = readList({ output, key: path });
        field.listItems?.forEach((item) => {
            items.forEach((entry) => expect(entry, `missing list field ${path}[].${item.key}`).toHaveProperty([item.value ?? item.key]));
        });
    });
}

function readList({ output, key }: { output: unknown; key: string }): unknown[] {
    if (output === null || typeof output !== 'object' || !(key in output)) {
        return [];
    }
    const value = Object.entries(output).find(([entryKey]) => entryKey === key)?.[1];
    return Array.isArray(value) ? value : [];
}

function context<Props extends InputPropertyMap>(propsValue: StaticPropsValue<Props>) {
    return { ...createMockActionContext<Props>({ propsValue }), auth: CONNECTION };
}

function lastRequest(): Request {
    return sendRequest.mock.calls[sendRequest.mock.calls.length - 1][0];
}

const ROUTE_CASES: [ObjectTypeKey, string, ObjectTypeKey, string, string, ObjectTypeKey, string][] = [
    ['user_group', 'g1', 'user', 'u1', '/usergroups/g1/members', 'user', 'u1'],
    ['user', 'u1', 'user_group', 'g1', '/usergroups/g1/members', 'user', 'u1'],
    ['system', 's1', 'system_group', 'g2', '/systemgroups/g2/members', 'system', 's1'],
    ['user', 'u1', 'system', 's1', '/users/u1/associations', 'system', 's1'],
    ['application', 'a1', 'user_group', 'g1', '/applications/a1/associations', 'user_group', 'g1'],
    ['system_group', 'g2', 'user_group', 'g1', '/systemgroups/g2/associations', 'user_group', 'g1'],
];

const CONNECTION: AppConnectionValueForAuthProperty<typeof jumpcloudAuth> = {
    type: AppConnectionType.CUSTOM_AUTH,
    props: { apiKey: 'key', region: 'us', orgId: undefined },
};

type Request = {
    method: string;
    url: string;
    body?: unknown;
    queryParams?: Record<string, string>;
};
