import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addAGlobalVariableAction } from '../src/lib/actions/storage/add-a-global-variable';
import { addAPermFileAction } from '../src/lib/actions/storage/add-a-perm-file';
import { deleteAGlobalVariableAction } from '../src/lib/actions/storage/delete-a-global-variable';
import { deleteAPermFileAction } from '../src/lib/actions/storage/delete-a-perm-file';
import { getAGlobalVariableAction } from '../src/lib/actions/storage/get-a-global-variable';
import { getAPermFileAction } from '../src/lib/actions/storage/get-a-perm-file';
import { listGlobalVariablesAction } from '../src/lib/actions/storage/list-global-variables';
import { listPermFilesAction } from '../src/lib/actions/storage/list-perm-files';
import { zeroCodeKitStorage } from '../src/lib/common/storage';
import { loadDropdownOptions, runAction, TEST_AUTH } from './helpers';

const sendRequest = vi.fn();
const write = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function sent(index = 0) {
    return sendRequest.mock.calls[index][0];
}

beforeEach(() => {
    sendRequest.mockReset();
    write.mockReset();
    write.mockResolvedValue('file://saved');
});

describe('storage metadata', () => {
    const actions: [string, MetadataAction, string, boolean][] = [
        ['Add a Global Variable', addAGlobalVariableAction, 'WRITE', false],
        ['Delete a Global Variable', deleteAGlobalVariableAction, 'DESTRUCTIVE', false],
        ['Get a Global Variable', getAGlobalVariableAction, 'READ', true],
        ['List Global Variables', listGlobalVariablesAction, 'SEARCH', true],
        ['Add a Perm File', addAPermFileAction, 'WRITE', false],
        ['Delete a Perm File', deleteAPermFileAction, 'DESTRUCTIVE', false],
        ['Get a Perm File', getAPermFileAction, 'READ', true],
        ['List Perm Files', listPermFilesAction, 'SEARCH', true],
    ];

    it.each(actions)('%s has the expected metadata', (displayName, action, classification, idempotent) => {
        expect(action.displayName).toBe(displayName);
        expect(action.classification).toBe(classification);
        expect(action.audience).toBe('both');
        expect(action.aiMetadata?.idempotent).toBe(idempotent);
        expect(action.aiMetadata?.description?.length).toBeGreaterThan(20);
    });
});

describe('global variables', () => {
    it('Add sends name and value with the auth header', async () => {
        respond({ variableName: 'myVar', variableValue: 'hello' });
        const result = await runAction({ action: addAGlobalVariableAction, propsValue: { variableName: ' myVar ', variableValue: 'hello' }, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/globalvariables/add');
        expect(sent().headers).toEqual({ auth: 'zck_test' });
        expect(sent().body).toEqual({ variableName: 'myVar', variableValue: 'hello' });
        expect(result).toEqual({ variable_name: 'myVar', variable_value: 'hello' });
    });

    it('Add omits an empty name so 0CodeKit generates one', async () => {
        respond({ variableName: 'auto123', variableValue: 'x' });
        await runAction({ action: addAGlobalVariableAction, propsValue: { variableName: '', variableValue: 'x' }, write });
        expect(sent().body).toEqual({ variableValue: 'x' });
    });

    it('Delete sends the name as variableId', async () => {
        respond({ message: 'Successfully deleted global variable with id myVar.' });
        const result = await runAction({ action: deleteAGlobalVariableAction, propsValue: { variableName: 'myVar' }, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/globalvariables/del');
        expect(sent().body).toEqual({ variableId: 'myVar' });
        expect(result).toEqual({
            deleted: true,
            variable_name: 'myVar',
            message: 'Successfully deleted global variable with id myVar.',
        });
    });

    it('Get returns a flat variable', async () => {
        respond({ variableName: 'myVar', variableValue: 'hello' });
        const result = await runAction({ action: getAGlobalVariableAction, propsValue: { variableName: 'myVar' }, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/globalvariables/get');
        expect(sent().body).toEqual({ variableName: 'myVar' });
        expect(result).toEqual({ variable_name: 'myVar', variable_value: 'hello' });
    });

    it('List returns variables with a count', async () => {
        respond({ variables: [{ variableName: 'a', variableValue: '1' }, { variableName: 'b', variableValue: '2' }] });
        const result = await runAction({ action: listGlobalVariablesAction, propsValue: {}, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/globalvariables/list');
        expect(result).toEqual({
            count: 2,
            variables: [
                { variable_name: 'a', variable_value: '1' },
                { variable_name: 'b', variable_value: '2' },
            ],
        });
    });

    it('surfaces 0CodeKit error messages', async () => {
        sendRequest.mockRejectedValueOnce(new Error('boom'));
        await expect(runAction({ action: getAGlobalVariableAction, propsValue: { variableName: 'missing' }, write })).rejects.toThrow('boom');
    });
});

describe('perm files', () => {
    it('Add uploads a file as base64 with its name', async () => {
        respond({ fileId: 'f1', url: 'https://prod.0codekit.com/f1/report.pdf' });
        const result = await runAction({ action: addAPermFileAction, propsValue: {
            file: { filename: 'report.pdf', extension: 'pdf', data: Buffer.from('pdf'), base64: 'cGRm' },
        }, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/perm/add');
        expect(sent().body).toEqual({ fileBuffer: 'cGRm', uploadName: 'report.pdf' });
        expect(result).toEqual({ file_id: 'f1', url: 'https://prod.0codekit.com/f1/report.pdf', file_name: 'report.pdf' });
    });

    it('Add uploads from a URL with a custom name', async () => {
        respond({ fileId: 'f2', url: 'https://prod.0codekit.com/f2/a.png' });
        await runAction({ action: addAPermFileAction, propsValue: { fileUrl: ' https://example.com/a.png ', uploadName: 'a.png' }, write });
        expect(sent().body).toEqual({ fileUrl: 'https://example.com/a.png', uploadName: 'a.png' });
    });

    it('Add rejects when neither file nor URL is given', async () => {
        await expect(runAction({ action: addAPermFileAction, propsValue: { fileUrl: ' ' }, write })).rejects.toThrow(/File or a File URL/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Delete sends the file id', async () => {
        respond({ message: 'deleted' });
        const result = await runAction({ action: deleteAPermFileAction, propsValue: { fileId: 'f1' }, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/perm/del');
        expect(sent().body).toEqual({ fileId: 'f1' });
        expect(result).toEqual({ deleted: true, file_id: 'f1', message: 'deleted' });
    });

    it('Get returns only the link when Link Only is on', async () => {
        respond({ url: 'https://prod.0codekit.com/f1/report.pdf' });
        const result = await runAction({ action: getAPermFileAction, propsValue: { fileId: 'f1', linkOnly: true }, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/perm/get');
        expect(sent().body).toEqual({ fileId: 'f1', getAsUrl: true });
        expect(sendRequest).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ file_id: 'f1', url: 'https://prod.0codekit.com/f1/report.pdf' });
    });

    it('Get downloads the file and stores it without base64 in the output', async () => {
        respond({ url: 'https://prod.0codekit.com/f1/my%20report.pdf' });
        respond(new TextEncoder().encode('pdf-bytes').buffer);
        const result = await runAction({ action: getAPermFileAction, propsValue: { fileId: 'f1' }, write });
        expect(sent(1).url).toBe('https://prod.0codekit.com/f1/my%20report.pdf');
        expect(sent(1).responseType).toBe('arraybuffer');
        expect(write).toHaveBeenCalledWith({ fileName: 'my report.pdf', data: Buffer.from('pdf-bytes') });
        expect(result).toEqual({
            file_id: 'f1',
            url: 'https://prod.0codekit.com/f1/my%20report.pdf',
            file: 'file://saved',
            file_name: 'my report.pdf',
            size_bytes: 9,
        });
    });

    it('Get fails clearly when no link comes back', async () => {
        respond({});
        await expect(runAction({ action: getAPermFileAction, propsValue: { fileId: 'f1' }, write })).rejects.toThrow(/download link/);
    });

    it('List returns flat files, count and remaining storage', async () => {
        respond({
            availableStorage: 1000,
            files: [{ fileId: 'f1', fileName: 'report.pdf', url: 'https://prod.0codekit.com/f1', size: 12 }],
        });
        const result = await runAction({ action: listPermFilesAction, propsValue: {}, write });
        expect(sent().url).toBe('https://v2.1saas.co/storage/perm/list');
        expect(result).toEqual({
            count: 1,
            available_storage_kib: 1000,
            files: [{ file_id: 'f1', file_name: 'report.pdf', url: 'https://prod.0codekit.com/f1', size_kib: 12 }],
        });
    });
});

describe('storage dropdowns', () => {
    it('variable dropdown lists names from the list endpoint', async () => {
        respond({ variables: [{ variableName: 'a', variableValue: '1' }] });
        const prop = zeroCodeKitStorage.variableName({ description: 'd' });
        const options = await loadDropdownOptions({ dropdown: prop, auth: TEST_AUTH });
        expect(options).toEqual({ disabled: false, options: [{ label: 'a', value: 'a' }] });
    });

    it('perm file dropdown uses file ids as values', async () => {
        respond({ availableStorage: 1, files: [{ fileId: 'f1', fileName: 'r.pdf', url: 'u', size: 3 }] });
        const prop = zeroCodeKitStorage.permFileId({ description: 'd' });
        const options = await loadDropdownOptions({ dropdown: prop, auth: TEST_AUTH });
        expect(options).toEqual({ disabled: false, options: [{ label: 'r.pdf (3 KiB)', value: 'f1' }] });
    });

    it('dropdowns ask for a connection first', async () => {
        const prop = zeroCodeKitStorage.permFileId({ description: 'd' });
        const options = await loadDropdownOptions({ dropdown: prop, auth: undefined });
        expect(options).toMatchObject({ disabled: true });
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

type MetadataAction = {
    displayName: string;
    classification?: string;
    audience?: string;
    aiMetadata?: { description?: string; idempotent?: boolean };
};
