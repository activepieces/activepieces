// packages/pieces/community/huly/src/lib/common/client.ts
// ... (existing imports)

export async function hulyApiCall(...) {
    try {
        // ... (existing request logic)
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
            throw new Error("Authentication failed. Please check your Huly API Key.");
        }
        // Only return the message or specific error body fields, never the full request/response objects
        const errorMessage = error.response?.body?.message || error.message;
        throw new Error(`Huly API Request failed: ${errorMessage}`);
    }
}
