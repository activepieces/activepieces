import { OutputSchema } from '@activepieces/pieces-framework';

const userFields: OutputSchema['fields'] = [
    { key: 'id', label: 'User ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'employee_id', label: 'Employee ID' },
    { key: 'employee_type', label: 'Employee Type' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'department', label: 'Department' },
    { key: 'company', label: 'Company' },
    { key: 'cost_center', label: 'Cost Center' },
    { key: 'location', label: 'Location' },
    { key: 'manager_id', label: 'Manager ID' },
    { key: 'state', label: 'State' },
    { key: 'activated', label: 'Activated', format: 'boolean' },
    { key: 'account_locked', label: 'Account Locked', format: 'boolean' },
    { key: 'suspended', label: 'Suspended', format: 'boolean' },
    { key: 'password_expired', label: 'Password Expired', format: 'boolean' },
    { key: 'mfa_configured', label: 'MFA Configured', format: 'boolean' },
    { key: 'totp_enabled', label: 'TOTP Enabled', format: 'boolean' },
    { key: 'created', label: 'Created', format: 'datetime' },
];

export const userOutputSchema: OutputSchema = {
    fields: userFields,
};

export const findUserOutputSchema: OutputSchema = {
    fields: [{ key: 'found', label: 'Found', format: 'boolean' }, ...userFields],
};

export const associationOutputSchema: OutputSchema = {
    fields: [
        { key: 'object_type', label: 'Object Type' },
        { key: 'object_id', label: 'Object ID' },
        { key: 'associated_type', label: 'Associated Type' },
        { key: 'associated_id', label: 'Associated Object ID' },
        { key: 'associated', label: 'Associated', format: 'boolean' },
    ],
};

export const resetMfaOutputSchema: OutputSchema = {
    fields: [
        { key: 'user_id', label: 'User ID' },
        { key: 'mfa_reset', label: 'MFA Reset', format: 'boolean' },
        { key: 'grace_period_days', label: 'Grace Period (days)', format: 'number' },
    ],
};

export const userOnSystemOutputSchema: OutputSchema = {
    fields: [
        { key: 'user_id', label: 'User ID' },
        { key: 'system_id', label: 'System ID' },
        { key: 'sudo_enabled', label: 'Administrator (sudo) Rights', format: 'boolean' },
        { key: 'sudo_without_password', label: 'Sudo Without Password', format: 'boolean' },
    ],
};

export const runCommandOutputSchema: OutputSchema = {
    fields: [
        { key: 'trigger_name', label: 'Trigger Name' },
        { key: 'command_ids', label: 'Launched Command IDs' },
        { key: 'waited', label: 'Waited For Results', format: 'boolean' },
        { key: 'completed', label: 'All Commands Reported', format: 'boolean' },
        {
            key: 'results',
            label: 'Results',
            labelKey: 'system_name',
            listItems: [
                { key: 'command_id', label: 'Command ID' },
                { key: 'command_name', label: 'Command Name' },
                { key: 'system_id', label: 'System ID' },
                { key: 'system_name', label: 'System Name' },
                { key: 'run_as_user', label: 'Run As User' },
                { key: 'exit_code', label: 'Exit Code', format: 'number' },
                { key: 'output', label: 'Output' },
                { key: 'error', label: 'Error' },
                { key: 'request_time', label: 'Requested At', format: 'datetime' },
                { key: 'response_time', label: 'Completed At', format: 'datetime' },
            ],
        },
    ],
};
