export const baseUrl = 'https://pollybot.app/api/v1';

export const leadStatusOptions = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    converted: 'Converted',
    lost: 'Lost',
    follow_up: 'Follow Up',
};

// Helper to format error messages exactly like your Zapier handleApiError
export function formatError(e: unknown): string {
    const error = e as {
        response?: {
            status?: number;
            body?: {
            error?: string;
            details?: unknown;
            };
        };
        message?: string;
    };

    const status = error.response?.status;
    const errorData = error.response?.body || {};
    const message = errorData.error || error.message || 'Unknown Error';
    const details = errorData.details ? JSON.stringify(errorData.details) : '';

    return `Error (${status}): ${message}. ${details}`;
}
