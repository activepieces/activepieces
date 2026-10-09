import type { AppConnectionType } from '@activepieces/pieces-framework';

export type OpnformAuthValue = {
    type: AppConnectionType.CUSTOM_AUTH;
    props: { baseApiUrl?: string; apiKey: string };
};

export type OpnformWorkspace = { id: string; name: string };

export type OpnformForm = { id: string; title: string; slug?: string };

export type OpnformFormPage = {
    meta?: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
    data: OpnformForm[];
};

export type OpnformIntegration = {
    id: number;
    integration_id: string;
    data?: { webhook_url?: string; provider_url?: string };
};

export type OpnformCreateIntegrationResponse = {
    form_integration: {
        id: number;
        integration_id: string;
    };
};
