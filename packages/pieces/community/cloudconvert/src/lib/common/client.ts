import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export class CloudConvertClient {
    private readonly auth: any;
    private readonly baseUrl: string;

    constructor(auth: any) {
        this.auth = auth;

        const region = auth.region || 'auto';
        switch (region) {
            case 'eu-central':
                this.baseUrl = 'https://eu-central.api.cloudconvert.com/v2';
                break;
            case 'us-east':
                this.baseUrl = 'https://us-east.api.cloudconvert.com/v2';
                break;
            default:
                this.baseUrl = 'https://api.cloudconvert.com/v2';
        }
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
        // OAuth2 authentication
        const authConfig = {
            type: AuthenticationType.BEARER_TOKEN as const,
            token: this.auth.access_token,
        };

        const response = await httpClient.sendRequest({
            method: method,
            url: `${this.baseUrl}${resourceUri}`,
            body,
            queryParams,
            authentication: authConfig
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

    async createUploadTask(filename: string) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/import/upload',
            body: {
                filename
            }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create upload task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async createImportBase64Task(fileContent: string, filename: string) {
        const response = await this.apiCall({
            method: HttpMethod.POST,
            resourceUri: '/import/base64',
            body: {
                file: fileContent,
                filename
            }
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create base64 import task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
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

    async createJob(tasks: Record<string, any>, tag?: string) {
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

    async getTask(taskId: string, queryParams?: Record<string, string>) {
        const response = await this.apiCall({
            method: HttpMethod.GET,
            resourceUri: `/tasks/${taskId}`,
            queryParams
        });

        if (response.status !== 200) {
            throw new Error(`Failed to get task: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data;
    }

    async getSupportedFormats(options?: {
        inputFormat?: string;
        outputFormat?: string;
        engine?: string;
        include?: string[];
    }) {
        const queryParams: Record<string, string> = {};

        if (options?.inputFormat) {
            queryParams['filter[input_format]'] = options.inputFormat;
        }
        if (options?.outputFormat) {
            queryParams['filter[output_format]'] = options.outputFormat;
        }
        if (options?.engine) {
            queryParams['filter[engine]'] = options.engine;
        }
        if (options?.include) {
            queryParams['include'] = options.include.join(',');
        }

        const response = await this.apiCall({
            method: HttpMethod.GET,
            resourceUri: '/convert/formats',
            queryParams
        });

        if (response.status !== 200) {
            throw new Error(`Failed to get supported formats: HTTP ${response.status} - ${response.body?.message || 'Unknown error'}`);
        }

        return response.body.data || [];
    }
}

export const cloudconvertCommon = {
    baseUrl: (region = 'auto') => {
        switch (region) {
            case 'eu-central':
                return 'https://eu-central.api.cloudconvert.com/v2';
            case 'us-east':
                return 'https://us-east.api.cloudconvert.com/v2';
            default:
                return 'https://api.cloudconvert.com/v2';
        }
    },

    createClient(auth: any) {
        return new CloudConvertClient(auth);
    },

    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: any;
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
