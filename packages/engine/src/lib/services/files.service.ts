import fs from 'fs/promises';
import { globals } from '../globals';
import { ApFile } from '@activepieces/pieces-framework';
import { isString } from '@activepieces/shared';

const DB_PREFIX_URL = 'db://';
const FILE_PREFIX_URL = 'file://';

export type DefaultFileSystem = 'db' | 'local';

export function createFilesService({ stepName, type }: { stepName: string, type: DefaultFileSystem }) {
    return {
        async write({ fileName, data }: { fileName: string, data: Buffer }): Promise<string> {
            switch (type) {
                case 'db':
                    return writeDbFile({ stepName, flowId: globals.flowId!, fileName, data });
                case 'local':
                    return writeLocalFile({ stepName, fileName, data });
            }
        }
    }
};

export function isApFilePath(dbPath: unknown): boolean {
    if (!isString(dbPath)) {
        return false;
    }
    return dbPath.startsWith(FILE_PREFIX_URL) || dbPath.startsWith(DB_PREFIX_URL);
}

export async function handleAPFile(path: string) {
    if (path.startsWith(DB_PREFIX_URL)) {
        return readDbFile(path);
    } else if (path.startsWith(FILE_PREFIX_URL)) {
        return readLocalFile(path);
    } else {
        throw new Error(`error=local_file_not_found absolute_path=${path}`);
    }
}

async function writeDbFile({ stepName, flowId, fileName, data }: { stepName: string, flowId: string, fileName: string, data: Buffer }): Promise<string> {
    const formData = new FormData();
    formData.append('stepName', stepName);
    formData.append('name', fileName);
    formData.append('flowId', flowId);
    formData.append('file', new Blob([data], { type: 'application/octet-stream' }));

    const response = await fetch(globals.apiUrl + '/v1/step-files', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + globals.workerToken
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to store entry');
    }
    const result = await response.json();
    return DB_PREFIX_URL + `${result.id}`
}

async function readDbFile(absolutePath: string): Promise<ApFile> {
    const fileId = absolutePath.replace(DB_PREFIX_URL, '');
    console.log("1 " + fileId);
    const response = await fetch(globals.apiUrl + `/v1/step-files/${encodeURIComponent(fileId)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + globals.workerToken
        },
    });
    if (!response.ok) {
        throw new Error(`error=db_file_not_found id=${absolutePath}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'unknown';
    const extension = filename.split('.').pop()!;
    return new ApFile(filename, Buffer.from(arrayBuffer), extension);
}



async function writeLocalFile({ stepName, fileName, data }: { stepName: string, fileName: string, data: Buffer }): Promise<string> {
    const path = 'tmp/' + stepName + '/' + fileName;
    await fs.mkdir('tmp/' + stepName, { recursive: true });
    await fs.writeFile(path, data);
    return FILE_PREFIX_URL + stepName + '/' + fileName

}

async function readLocalFile(absolutePath: string): Promise<ApFile> {
    const path = 'tmp/' + absolutePath.replace(FILE_PREFIX_URL, '');
    const buffer = await fs.readFile(path);
    const filename = absolutePath.split('/').pop()!;
    const extension = filename.split('.').pop()!;
    return new ApFile(filename, buffer, extension);
}