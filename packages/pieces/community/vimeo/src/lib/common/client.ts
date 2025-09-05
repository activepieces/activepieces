import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';

export const vimeoCommon = {
    baseUrl: 'https://api.vimeo.com',
    
    /**
     * Makes authenticated API calls to Vimeo using OAuth 2.0 Bearer tokens
     * Follows official Vimeo API documentation for authentication and headers
     */
    async apiCall(params: {
        auth: any;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        query?: Record<string, string>;
        customHeaders?: Record<string, string>;
    }) {
        const { auth, method, resourceUri, body, query, customHeaders } = params;
        
        if (!auth || !auth.access_token) {
            throw new Error('Authentication required: Valid access token must be provided');
        }
        
        const queryString = query ? '?' + new URLSearchParams(query).toString() : '';
        
        const headers: Record<string, string> = {
            // OAuth 2.0 Bearer token as per official documentation
            'Authorization': `Bearer ${auth.access_token}`,
            // Required Content-Type for JSON requests
            'Content-Type': 'application/json',
            // Required Accept header for API version 3.4 as per documentation
            'Accept': 'application/vnd.vimeo.*+json;version=3.4',
            // Add any custom headers
            ...customHeaders
        };

        const request: HttpRequest = {
            method,
            url: `${this.baseUrl}${resourceUri}${queryString}`,
            headers,
            body: body ? JSON.stringify(body) : undefined
        };

        try {
            const response = await httpClient.sendRequest(request);
            
            // Handle common authentication errors as per documentation
            if (response.status === 401) {
                const errorBody = response.body;
                if (errorBody?.error_code === 8003) {
                    throw new Error('Invalid access token: The provided access token is not recognized or has expired');
                } else if (errorBody?.error_code === 8002) {
                    throw new Error('No user associated with access token: The token may be invalid or expired');
                } else {
                    throw new Error('Authentication failed: Please check your access token and permissions');
                }
            }
            
            return response;
        } catch (error: any) {
            if (error.message?.includes('access token')) {
                throw error; // Re-throw authentication errors as-is
            }
            throw new Error(`Vimeo API request failed: ${error.message || 'Unknown error'}`);
        }
    },
    
    /**
     * Validates if the current access token has the required scope
     * @param auth - The authentication object containing the access token
     * @param requiredScope - The scope to check for
     */
    async validateScope(auth: any, requiredScope: string) {
        try {
            const response = await this.apiCall({
                auth,
                method: HttpMethod.GET,
                resourceUri: '/oauth/verify'
            });
            
            const scopes = response.body?.scope?.split(' ') || [];
            return scopes.includes(requiredScope);
        } catch {
            return false;
        }
    }
};
