import { ApiRecord, FlatObject, ObjectTypeKey } from './types';

export const jumpcloudOutput = {
    flatten,
    flattenCommandResult,
};

function flatten({ type, record }: { type: ObjectTypeKey; record: ApiRecord }): FlatObject {
    switch (type) {
        case 'user':
            return flattenUser(record);
        case 'system':
            return flattenSystem(record);
        case 'user_group':
        case 'system_group':
            return flattenGroup(record);
        case 'application':
            return flattenApplication(record);
    }
}

function flattenUser(record: ApiRecord): FlatObject {
    const mfa = record['mfa'];
    return {
        id: str(record['_id']),
        username: str(record['username']),
        email: str(record['email']),
        first_name: str(record['firstname']),
        last_name: str(record['lastname']),
        display_name: str(record['displayname']),
        employee_id: str(record['employeeIdentifier']),
        employee_type: str(record['employeeType']),
        job_title: str(record['jobTitle']),
        department: str(record['department']),
        company: str(record['company']),
        cost_center: str(record['costCenter']),
        location: str(record['location']),
        manager_id: str(record['manager']),
        state: str(record['state']),
        activated: bool(record['activated']),
        account_locked: bool(record['account_locked']),
        suspended: bool(record['suspended']),
        password_expired: bool(record['password_expired']),
        mfa_configured: mfa !== null && typeof mfa === 'object' && 'configured' in mfa ? bool(mfa.configured) : null,
        totp_enabled: bool(record['totp_enabled']),
        created: str(record['created']),
    };
}

function flattenSystem(record: ApiRecord): FlatObject {
    return {
        id: str(record['_id']),
        display_name: str(record['displayName']),
        hostname: str(record['hostname']),
        os: str(record['os']),
        os_family: str(record['osFamily']),
        os_version: str(record['version']),
        architecture: str(record['arch']),
        serial_number: str(record['serialNumber']),
        agent_version: str(record['agentVersion']),
        active: bool(record['active']),
        last_contact: str(record['lastContact']),
        remote_ip: str(record['remoteIP']),
        created: str(record['created']),
    };
}

function flattenGroup(record: ApiRecord): FlatObject {
    return {
        id: str(record['id']),
        name: str(record['name']),
        description: str(record['description']),
        email: str(record['email']),
        type: str(record['type']),
        membership_method: str(record['membershipMethod']),
    };
}

function flattenApplication(record: ApiRecord): FlatObject {
    return {
        id: str(record['_id']),
        name: str(record['name']),
        display_label: str(record['displayLabel']),
        display_name: str(record['displayName']),
        description: str(record['description']),
        sso_url: str(record['ssoUrl']),
        active: bool(record['active']),
        created: str(record['created']),
    };
}

function flattenCommandResult({ commandId, record }: { commandId: string; record: ApiRecord }): FlatObject {
    const response = record['response'];
    const data = response !== null && typeof response === 'object' && 'data' in response ? response.data : undefined;
    return {
        command_id: commandId,
        command_name: str(record['name']),
        system_id: str(record['systemId']),
        system_name: str(record['system']),
        run_as_user: str(record['user']),
        exit_code: data !== null && typeof data === 'object' && 'exitCode' in data && typeof data.exitCode === 'number' ? data.exitCode : null,
        output: data !== null && typeof data === 'object' && 'output' in data ? str(data.output) : null,
        error: response !== null && typeof response === 'object' && 'error' in response ? str(response.error) : null,
        request_time: str(record['requestTime']),
        response_time: str(record['responseTime']),
    };
}

function str(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

function bool(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
}
