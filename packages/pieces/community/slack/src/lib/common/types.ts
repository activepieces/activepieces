export type ViewSubmissionPayload = {
    type: string;
    team: {
        id: string;
    };
    api_app_id: string;
    token: string;
    trigger_id: string;
};
