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

function inputsValue(inputs: unknown): unknown {
    return inputs === undefined || inputs === null || inputs === '' ? {} : inputs;
}

function withJavascriptInputs({ code, inputs }: InjectParams): string {
    const assignment = `const inputs = ${JSON.stringify(inputsValue(inputs))};`;
    return insertLine({ code, line: assignment, at: lineAfterJavascriptPrologue });
}

function withPythonInputs({ code, inputs }: InjectParams): string {
    const assignment = `inputs = __import__("json").loads(${JSON.stringify(JSON.stringify(inputsValue(inputs)))})`;
    return insertLine({ code, line: assignment, at: lineAfterFutureImports });
}

function insertLine({ code, line, at }: { code: string; line: string; at: (lines: string[]) => number }): string {
    const lines = code.split('\n');
    const index = at(lines);
    return [...lines.slice(0, index), line, ...lines.slice(index)].join('\n');
}

function lineAfterJavascriptPrologue(lines: string[]): number {
    let end = 0;
    for (const [index, line] of lines.entries()) {
        const trimmed = line.trim();
        if ((index === 0 && trimmed.startsWith('#!')) || JAVASCRIPT_DIRECTIVE.test(trimmed)) {
            end = index + 1;
        } else if (trimmed !== '' && !trimmed.startsWith('//')) {
            break;
        }
    }
    return end;
}

function lineAfterFutureImports(lines: string[]): number {
    const state: FutureScan = { end: 0, docstringAllowed: true, openDocstring: undefined, inGroup: false, inContinuation: false };
    for (const [index, line] of lines.entries()) {
        if (!scanPythonHeaderLine({ state, line, index })) {
            break;
        }
    }
    return state.end;
}

function scanPythonHeaderLine({ state, line, index }: { state: FutureScan; line: string; index: number }): boolean {
    const trimmed = line.trim();
    if (state.openDocstring !== undefined) {
        state.openDocstring = line.includes(state.openDocstring) ? undefined : state.openDocstring;
        return true;
    }
    if (state.inGroup || state.inContinuation || PYTHON_FUTURE_IMPORT.test(line)) {
        state.inGroup = (state.inGroup || (PYTHON_FUTURE_IMPORT.test(line) && line.includes('('))) && !line.includes(')');
        state.inContinuation = line.trimEnd().endsWith('\\');
        state.end = index + 1;
        state.docstringAllowed = false;
        return true;
    }
    if (trimmed === '' || trimmed.startsWith('#')) {
        return true;
    }
    const quote = PYTHON_DOCSTRING_START.exec(trimmed)?.[1];
    if (quote === undefined || !state.docstringAllowed) {
        return false;
    }
    state.docstringAllowed = false;
    const afterOpening = trimmed.slice(trimmed.indexOf(quote) + quote.length);
    state.openDocstring = quote.length === 3 && !afterOpening.includes(quote) ? quote : undefined;
    return true;
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

const PYTHON_FUTURE_IMPORT = /^from\s+__future__\s+import\b/;

const PYTHON_DOCSTRING_START = /^[rRuU]?("""|'''|"|')/;

const JAVASCRIPT_DIRECTIVE = /^(['"])use strict\1;?$/;

type ExecuteParams = {
    apiKey: string;
    path: string;
    body: Record<string, unknown>;
};

type CodeResult = {
    result: unknown;
};

type FutureScan = {
    end: number;
    docstringAllowed: boolean;
    openDocstring: string | undefined;
    inGroup: boolean;
    inContinuation: boolean;
};

type InjectParams = {
    code: string;
    inputs: unknown;
};
