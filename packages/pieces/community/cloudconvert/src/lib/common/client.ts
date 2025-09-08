import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const CLOUDCONVERT_API_BASE_URL = 'https://api.cloudconvert.com/v2';

export class CloudConvertClient {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async apiCall({
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        const response = await httpClient.sendRequest({
            method: method,
            url: `${CLOUDCONVERT_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: this.apiKey,
            }
        });

        return response;
    }

    async createImportTask(fileUrl: string, filename?: string) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/import/url',
            body: {
                url: fileUrl,
                ...(filename && { filename })
            }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create import task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createArchiveTask(input: string | string[], outputFormat: string, options?: {
        filename?: string;
        engine?: string;
        engineVersion?: string;
        timeout?: number;
    }) {
        const body: any = {
            input: Array.isArray(input) && input.length === 1 ? input[0] : input,
            output_format: outputFormat,
        };

        if (options?.filename) {
            body.filename = options.filename;
        }
        if (options?.engine) {
            body.engine = options.engine;
            if (options.engineVersion) {
                body.engine_version = options.engineVersion;
            }
        }
        if (options?.timeout) {
            body.timeout = options.timeout;
        }

        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/archive',
            body
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create archive task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createCaptureTask(options: {
        url: string;
        output_format: string;
        pages?: string;
        zoom?: number;
        page_width?: number;
        page_height?: number;
        page_format?: string;
        page_orientation?: string;
        margin_top?: number;
        margin_bottom?: number;
        margin_left?: number;
        margin_right?: number;
        print_background?: boolean;
        display_header_footer?: boolean;
        header_template?: string;
        footer_template?: string;
        wait_until?: string;
        wait_for_element?: string;
        wait_time?: number;
        css_media_type?: string;
        filename?: string;
        engine?: string;
        engine_version?: string;
        timeout?: number;
    }) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/capture-website',
            body: options
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create capture task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createConvertTask(options: {
        input: string | string[];
        input_format?: string;
        output_format: string;
        filename?: string;
        engine?: string;
        engine_version?: string;
        timeout?: number;
        [key: string]: any;
    }) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/convert',
            body: options
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create convert task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createMergeTask(options: {
        input: string | string[];
        output_format: string;
        filename?: string;
        engine?: string;
        engine_version?: string;
        timeout?: number;
        [key: string]: any;
    }) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/merge',
            body: options
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create merge task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createOptimizeTask(options: {
        input: string | string[];
        input_format?: string;
        profile?: string;
        flatten_signatures?: boolean;
        colorspace?: string;
        filename?: string;
        engine?: string;
        engine_version?: string;
        timeout?: number;
        [key: string]: any;
    }) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/optimize',
            body: options
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create optimize task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createExportTask(inputTaskId: string) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/export/url',
            body: {
                input: inputTaskId
            }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create export task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createJob(tasks: Record<string, string>, tag?: string) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/jobs',
            body: {
                tasks,
                ...(tag && { tag })
            }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create job: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async getJob(jobId: string) {
        const response = await this.apiCall({
            method: HttpMethod.GET,
            resourceUri: `/jobs/${jobId}`
        });

        if (response.status !== 200) {
            throw new Error(`Failed to get job: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async getTask(taskId: string) {
        const response = await this.apiCall({
            method: HttpMethod.GET,
            resourceUri: `/tasks/${taskId}`
        });

        if (response.status !== 200) {
            throw new Error(`Failed to get task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }
}

export const cloudconvertCommon = {
    baseUrl: CLOUDCONVERT_API_BASE_URL,

    createClient(apiKey: string) {
        return new CloudConvertClient(apiKey);
    },

    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: string;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        const client = new CloudConvertClient(auth);
        return await client.apiCall({
            method,
            resourceUri,
            body,
            queryParams
        });
    },
};
