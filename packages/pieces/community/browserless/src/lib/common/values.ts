export const browserlessValues = {
    record,
    stringOrNull,
    numberOrNull,
    booleanOrNull,
    stringList,
    writeBase64File,
};

function record(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return {};
    }
    return Object.fromEntries(Object.entries(value));
}

function stringOrNull(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

function numberOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
}

function stringList(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

async function writeBase64File({ files, value, fileName }: { files: FileWriter; value: unknown; fileName: string }): Promise<string | null> {
    if (typeof value !== 'string' || value === '') {
        return null;
    }
    const base64 = value.replace(/^data:[^;]+;base64,/, '');
    return files.write({ fileName, data: Buffer.from(base64, 'base64') });
}

export type FileWriter = { write: (params: { fileName: string; data: Buffer }) => Promise<string> };
