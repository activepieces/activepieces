export type ViewSubmissionPayload = {
    type: string;
    team: {
        id: string;
    };
    api_app_id: string;
    token: string;
    trigger_id: string;
};

export type BlockActionsPayload = {
    type: string;
    token?: string;
    trigger_id?: string;
    api_app_id?: string;
    team?: {
        id: string;
        domain?: string;
    };
    user?: {
        id: string;
        username?: string;
        name?: string;
        team_id?: string;
    };
    channel?: {
        id: string;
        name?: string;
    };
    container?: Record<string, unknown>;
    message?: Record<string, unknown>;
    response_url?: string;
    actions?: BlockAction[];
};

export type BlockAction = {
    type: string;
    action_id: string;
    block_id?: string;
    value?: string;
    action_ts?: string;
};
