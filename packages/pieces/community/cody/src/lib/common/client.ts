import { HttpMethod, httpClient, HttpRequest, AuthenticationType } from "@activepieces/pieces-common";
import { AppConnectionValueForAuthProperty } from "@activepieces/pieces-framework";
import { codyAuth } from "../..";

export const CODY_BASE_URL = "https://getcody.ai/api/v1";

export interface CodyFolder {
    id: string;
    name: string;
}

export interface CodyListFoldersResponse {
    data: CodyFolder[];
}

export interface CodyCreateDocumentResponse {
    data: {
        id: string;
        name: string;
        status: string;
        content_url: string;
        folder_id: string;
        created_at: number;
    }
}

// New interfaces for file upload
export interface CodySignedUrlResponse {
    data: {
        url: string;
        key: string;
    }
}

export interface CodyConversation {
    id: string;
    name: string;
}

export interface CodyListConversationsResponse {
    data: CodyConversation[];
}

export interface CodyMessageResponse {
    data: {
        id: string;
        content: string;
        conversation_id: string;
        machine: boolean;
        failed_responding: boolean;
        flagged: boolean;
        created_at: number;
    }
}

export interface CodyBot {
    id: string;
    name: string;
}

export interface CodyListBotsResponse {
    data: CodyBot[];
}

export interface CodyCreateConversationResponse {
    data: CodyConversation;
}

export const codyClient = {
    async listFolders({secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>): Promise<CodyFolder[]> {
        const response = await httpClient.sendRequest<CodyListFoldersResponse>({
            method: HttpMethod.GET,
            url: `${CODY_BASE_URL}/folders`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
        });
        return response.body.data;
    },

    async createDocument(
        {secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>, 
        name: string, 
        folderId: string, 
        content: string
    ): Promise<CodyCreateDocumentResponse> {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${CODY_BASE_URL}/documents`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
            body: {
                name,
                folder_id: folderId,
                content,
            },
        };
        const response = await httpClient.sendRequest<CodyCreateDocumentResponse>(request);
        return response.body;
    },

    // New function to get the signed URL
    async getSignedUrl({secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>, fileName: string, contentType: string): Promise<CodySignedUrlResponse['data']> {
        const response = await httpClient.sendRequest<CodySignedUrlResponse>({
            method: HttpMethod.POST,
            url: `${CODY_BASE_URL}/uploads/signed-url`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
            body: {
                file_name: fileName,
                content_type: contentType
            }
        });
        return response.body.data;
    },

    // New function to upload the file buffer to S3
    async uploadFileToS3(signedUrl: string, fileBuffer: Buffer, contentType: string): Promise<void> {
            await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: signedUrl,
            body: fileBuffer,
            headers: {
                'Content-Type': contentType,
            },
        });
    },

    // New function to finalize the document creation
    async createDocumentFromFile({secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>, folderId: string, key: string): Promise<void> {
        await httpClient.sendRequest({
            method: HttpMethod.POST,
            // This endpoint was in your first documentation dump.
            url: `${CODY_BASE_URL}/documents/file`, 
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
            body: {
                folder_id: folderId,
                key: key,
            },
        });
    },
    
    async listConversations(
        {secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>, 
        params?: { botId?: string; keyword?: string }
    ): Promise<CodyConversation[]> {
        const queryParams: Record<string, string> = {};
        if (params?.botId) {
            queryParams['bot_id'] = params.botId;
        }
        if (params?.keyword) {
            queryParams['keyword'] = params.keyword;
        }

        const response = await httpClient.sendRequest<CodyListConversationsResponse>({
            method: HttpMethod.GET,
            url: `${CODY_BASE_URL}/conversations`,
            queryParams: queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
        });
        return response.body.data;
    },

    // New function to send a message
    async sendMessage({secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>, conversationId: string, content: string): Promise<CodyMessageResponse> {
        const response = await httpClient.sendRequest<CodyMessageResponse>({
            method: HttpMethod.POST,
            url: `${CODY_BASE_URL}/messages`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
            body: {
                conversation_id: conversationId,
                content: content,
            }
        });
        return response.body;
    },

    async listBots({secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>, keyword?: string): Promise<CodyBot[]> { // Add optional keyword parameter
        const queryParams: Record<string, string> = {};
        if (keyword) {
            queryParams['keyword'] = keyword;
        }

        const response = await httpClient.sendRequest<CodyListBotsResponse>({
            method: HttpMethod.GET,
            url: `${CODY_BASE_URL}/bots`,
            queryParams: queryParams, // Add queryParams to the request
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
        });
        return response.body.data;
    },

    // New function to create a conversation
    async createConversation(
        {secret_text}: AppConnectionValueForAuthProperty<typeof codyAuth>,
        botId: string,
        name: string,
        documentIds?: string[]
    ): Promise<CodyCreateConversationResponse> {
        const response = await httpClient.sendRequest<CodyCreateConversationResponse>({
            method: HttpMethod.POST,
            url: `${CODY_BASE_URL}/conversations`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: secret_text,
            },
            body: {
                bot_id: botId,
                name: name,
                document_ids: documentIds,
            }
        });
        return response.body;
    },

    
};