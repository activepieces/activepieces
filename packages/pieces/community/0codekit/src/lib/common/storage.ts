import { Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../auth';
import { zeroCodeKitApi } from './client';
import { zeroCodeKitFiles } from './files';

export const zeroCodeKitStorage = {
    listVariables,
    listPermFiles,
    variableName,
    permFileId,
    download,
    fileNameFromUrl,
    toVariable,
    toPermFile,
};

async function listVariables(apiKey: string): Promise<GlobalVariable[]> {
    const response = await zeroCodeKitApi.post<ListVariablesResponse>({
        apiKey,
        path: '/storage/globalvariables/list',
    });
    return response.variables ?? [];
}

async function listPermFiles(apiKey: string): Promise<ListPermFilesResponse> {
    return zeroCodeKitApi.post<ListPermFilesResponse>({
        apiKey,
        path: '/storage/perm/list',
    });
}

function variableName({ description }: { description: string }) {
    return Property.Dropdown({
        auth: zeroCodeKitAuth,
        displayName: 'Variable Name',
        description,
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, options: [], placeholder: 'Connect your 0CodeKit account first.' };
            }
            try {
                const variables = await listVariables(auth.secret_text);
                if (variables.length === 0) {
                    return { disabled: true, options: [], placeholder: 'No global variables found. Add one first.' };
                }
                return {
                    disabled: false,
                    options: variables.map((variable) => ({ label: variable.variableName, value: variable.variableName })),
                };
            } catch (error) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: zeroCodeKitApi.describe({ error, fallback: 'Could not load global variables.' }),
                };
            }
        },
    });
}

function permFileId({ description }: { description: string }) {
    return Property.Dropdown({
        auth: zeroCodeKitAuth,
        displayName: 'File',
        description,
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, options: [], placeholder: 'Connect your 0CodeKit account first.' };
            }
            try {
                const response = await listPermFiles(auth.secret_text);
                const files = response.files ?? [];
                if (files.length === 0) {
                    return { disabled: true, options: [], placeholder: 'No perm files found. Upload one first.' };
                }
                return {
                    disabled: false,
                    options: files.map((file) => ({ label: `${file.fileName} (${file.size} KiB)`, value: file.fileId })),
                };
            } catch (error) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: zeroCodeKitApi.describe({ error, fallback: 'Could not load perm files.' }),
                };
            }
        },
    });
}

async function download(url: string): Promise<Buffer> {
    return zeroCodeKitFiles.download({ url, failure: 'Downloading the perm file failed.' });
}

function fileNameFromUrl({ url, fallback }: { url: string; fallback: string }): string {
    try {
        const segments = new URL(url).pathname.split('/').filter((segment) => segment !== '');
        const last = segments[segments.length - 1];
        const name = last === undefined ? '' : decodeURIComponent(last).replace(/[\\/]/g, '_').trim();
        return name === '' ? fallback : name;
    } catch {
        return fallback;
    }
}

function toVariable(variable: GlobalVariable): VariableOutput {
    return { variable_name: variable.variableName, variable_value: variable.variableValue };
}

function toPermFile(file: PermFile): PermFileOutput {
    return { file_id: file.fileId, file_name: file.fileName, url: file.url, size_kib: file.size };
}

export type GlobalVariable = {
    variableName: string;
    variableValue: string;
};

export type PermFile = {
    fileId: string;
    fileName: string;
    url: string;
    size: number;
};

export type ListVariablesResponse = {
    variables?: GlobalVariable[];
};

export type ListPermFilesResponse = {
    availableStorage?: number;
    files?: PermFile[];
};

export type VariableOutput = {
    variable_name: string;
    variable_value: string;
};

export type PermFileOutput = {
    file_id: string;
    file_name: string;
    url: string;
    size_kib: number;
};
