import { InputFile } from './types';

export const inputFiles = {
    fromValue,
    fromArrayItems,
};

function fromValue(value: unknown): InputFile | undefined {
    if (!isRecord(value)) {
        return undefined;
    }
    const filename = value['filename'];
    const data = value['data'];
    if (typeof filename !== 'string' || !Buffer.isBuffer(data)) {
        return undefined;
    }
    return { filename, data };
}

function fromArrayItems({ items, key }: { items: unknown; key: string }): InputFile[] {
    if (!Array.isArray(items)) {
        return [];
    }
    return items.flatMap((item, index) => {
        if (!isRecord(item) || item[key] === undefined || item[key] === null || item[key] === '') {
            return [];
        }
        const file = fromValue(item[key]);
        if (file === undefined) {
            throw new Error(`File ${index + 1} could not be read. Pick a file from a previous step or upload one.`);
        }
        return [file];
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

