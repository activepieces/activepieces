import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { zeroCodeKitApi, ZEROCODEKIT_BASE_URL } from './client';

export const zeroCodeKitCode = {
    execute,
    describeRunError,
    stringList,
    withJavascriptInputs,
    withPythonInputs,
    javascriptResult,
    pythonResult,
    inputsProp,
    dependenciesProp,
};

export const CODE_TIMEOUT_MS = 190_000;

async function execute({ apiKey, path, body }: ExecuteParams): Promise<unknown> {
    try {
        const response = await httpClient.sendRequest<unknown>({
            method: HttpMethod.POST,
            url: `${ZEROCODEKIT_BASE_URL}${path}`,
            headers: { auth: apiKey },
            body,
            timeout: CODE_TIMEOUT_MS,
        });
        return response.body;
    } catch (error) {
        throw new Error(describeRunError(error));
    }
}

function describeRunError(error: unknown): string {
    if (isAbort(error)) {
        return `0CodeKit did not answer within ${CODE_TIMEOUT_MS / 1000} seconds. Code runs are limited to 180 seconds, including installing dependencies. Make the code faster or split the work into smaller runs.`;
    }
    const message = zeroCodeKitApi.describe({ error, fallback: 'Running the code on 0CodeKit failed.' });
    if (error instanceof HttpError && TIMEOUT_STATUSES.includes(error.response.status)) {
        return `${message}. Code runs are limited to 180 seconds and 512 MB of memory, including installing dependencies.`;
    }
    return message;
}

function isAbort(error: unknown): boolean {
    return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function stringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .filter((item): item is string | number => typeof item === 'string' || typeof item === 'number')
        .map((item) => String(item).trim())
        .filter((item) => item !== '');
}

function hasInputs(inputs: unknown): boolean {
    if (inputs === undefined || inputs === null || inputs === '') {
        return false;
    }
    if (isRecord(inputs)) {
        return Object.keys(inputs).length > 0;
    }
    return true;
}

function withJavascriptInputs({ code, inputs }: InjectParams): string {
    if (!hasInputs(inputs)) {
        return code;
    }
    return `const inputs = ${JSON.stringify(inputs)};\n${code}`;
}

function withPythonInputs({ code, inputs }: InjectParams): string {
    if (!hasInputs(inputs)) {
        return code;
    }
    return `inputs = __import__("json").loads(${JSON.stringify(JSON.stringify(inputs))})\n${code}`;
}

function javascriptResult(body: unknown): CodeResult {
    return toResult(body);
}

function pythonResult(body: unknown): CodeResult {
    if (isRecord(body) && 'result' in body) {
        return toResult(body['result']);
    }
    return toResult(body);
}

function toResult(value: unknown): CodeResult {
    return { result: value === undefined || value === '' ? null : value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function inputsProp({ variable }: { variable: string }) {
    return Property.Json({
        displayName: 'Inputs',
        description: `Data to pass into your code. It is available in the code as the \`${variable}\` variable. Map values from earlier steps here instead of pasting them into the code.`,
        required: false,
    });
}

function dependenciesProp() {
    return Property.Array({
        displayName: 'System Packages',
        description: 'Alpine Linux (apk) packages your code needs, such as `ffmpeg`. Leave empty if you only use language libraries.',
        required: false,
    });
}

const TIMEOUT_STATUSES = [408, 504];

type ExecuteParams = {
    apiKey: string;
    path: string;
    body: Record<string, unknown>;
};

type CodeResult = {
    result: unknown;
};

type InjectParams = {
    code: string;
    inputs: unknown;
};
