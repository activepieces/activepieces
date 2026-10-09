import type { AppConnectionType } from '@activepieces/pieces-framework';

export type OpnformAuthValue = {
    type: AppConnectionType.CUSTOM_AUTH;
    props: { baseApiUrl?: string; apiKey: string };
};

export type OpnformWorkspace = { id: string; name: string; icon?: string; settings?: Record<string, unknown> };

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

export type OpnformFormDetail = Record<string, unknown> & { id: number; slug: string };

export type OpnformPage<T> = {
    data: T[];
    links?: Record<string, unknown>;
    meta?: Record<string, unknown>;
};

export type OpnformSubmission = {
    id: number;
    form_id: number;
    completion_time?: number;
    data: Record<string, unknown>;
    meta?: Record<string, unknown>;
};

export type OpnformWorkspaceUser = { id: number; name: string; email: string; role: string };

export type OpnformWorkspaceInvite = {
    id: number;
    email: string;
    role: string;
    status: string;
    valid_until?: string;
};

export type OpnformMessage = { message?: string };

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

export type OpnformExportResponse = string | { message?: string; job_id?: string; is_async?: boolean };
