export type ViewSubmissionPayload = {
    type: string;
    team: {
        id: string;
    };
    api_app_id: string;
    token: string;
    trigger_id: string;
};

export type BlockAction = {
    type: string;
    action_id: string;
    block_id?: string;
    value?: string;
    action_ts?: string;
};
