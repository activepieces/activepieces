import { AppConnectionType } from '@activepieces/pieces-framework';

export type AccountAuthProps = {
    siteUrl: string;
    email: string;
    apiToken: string;
    cloudId?: string;
};

export type KeyAuthProps = {
    host: string;
    apiKey: string;
};

export type AccountConnection = {
    type: AppConnectionType.CUSTOM_AUTH;
    props: AccountAuthProps;
};

export type KeyConnection = {
    type: AppConnectionType.BASIC_AUTH;
    username: string;
    password: string;
};

export type JsmAuthValue = AccountConnection | KeyConnection;

export type AccountRoute = {
    kind: 'account';
    baseUrl: string;
    siteUrl: string;
    headers: Record<string, string>;
};

export type KeyRoute = {
    kind: 'key';
    baseUrl: string;
    headers: Record<string, string>;
};

export type Route = AccountRoute | KeyRoute;

export type AlertIdentifierType = 'id' | 'alias';

export type ResponderType = 'team' | 'user' | 'escalation' | 'schedule';

export type ApiResponder = {
    id?: string;
    name?: string;
    username?: string;
    type: string;
};

export type ApiAlert = {
    id?: string;
    tinyId?: string;
    createdAt?: string;
    updatedAt?: string;
    message?: string;
    entity?: string;
    source?: string;
    status?: string;
    alias?: string;
    tags?: string[];
    extraProperties?: Record<string, string>;
    description?: string;
    acknowledged?: boolean;
    ackTime?: string;
    closeTime?: string;
    count?: number;
    owner?: string;
    snoozed?: boolean;
    snoozedUntil?: string;
    lastOccuredAt?: string;
    lastOccurredAt?: string;
    integrationType?: string;
    integrationName?: string;
    priority?: string;
    responders?: ApiResponder[];
    actions?: string[];
    seen?: boolean;
};

export type ApiAlertList = {
    values?: ApiAlert[];
    count?: number;
};

export type ApiAsyncResponse = {
    result?: string;
    requestId?: string;
    took?: number;
};

export type ApiRequestStatus = {
    success?: boolean;
    isSuccess?: boolean;
    action?: string;
    processedAt?: string;
    integrationId?: string;
    status?: string;
    alertId?: string;
    alias?: string;
};

export type ApiNote = {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    note?: string;
    owner?: string;
};

export type ApiTeam = { teamId?: string; teamName?: string };

export type ApiTeamList = ApiTeam[] | { platformTeams?: ApiTeam[] };

export type ApiSchedule = {
    id?: string;
    name?: string;
    timezone?: string;
    enabled?: boolean;
};

export type ApiEscalation = {
    id?: string;
    name?: string;
};

export type ApiPage<T> = {
    values?: T[];
    links?: { next?: string };
};

export type ApiJiraUser = {
    accountId?: string;
    accountType?: string;
    displayName?: string;
    emailAddress?: string;
    active?: boolean;
};

export type ApiOnCallParticipant = {
    id?: string;
    type?: string;
    name?: string;
    forwardedFrom?: { id?: string; type?: string };
    onCallParticipants?: ApiOnCallParticipant[];
};

export type ApiOnCallResponse = {
    onCallParticipants?: ApiOnCallParticipant[];
    onCallUsers?: string[];
};

export type AlertOutput = {
    id: string | null;
    tiny_id: string | null;
    message: string | null;
    description: string | null;
    status: string | null;
    priority: string | null;
    alias: string | null;
    entity: string | null;
    source: string | null;
    owner: string | null;
    acknowledged: boolean | null;
    seen: boolean | null;
    snoozed: boolean | null;
    snoozed_until: string | null;
    count: number | null;
    tags: string | null;
    actions: string | null;
    responders: string | null;
    extra_properties: Record<string, string>;
    integration_name: string | null;
    integration_type: string | null;
    created_at: string | null;
    updated_at: string | null;
    last_occurred_at: string | null;
    ack_time: string | null;
    close_time: string | null;
};

export type RequestResult = {
    request_id: string | null;
    processed: boolean;
    success: boolean | null;
    action: string | null;
    status: string | null;
    alert_id: string | null;
    alias: string | null;
    processed_at: string | null;
};

export type AlertActionResult = RequestResult & {
    note_added: boolean | null;
    note_error: string | null;
};

export type OnCallParticipantOutput = {
    id: string | null;
    type: string | null;
    name: string | null;
    parent_id: string | null;
    parent_type: string | null;
    forwarded_from_id: string | null;
};
