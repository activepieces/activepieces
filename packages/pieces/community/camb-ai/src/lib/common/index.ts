import { FilesService, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { cambaiAuth } from '../auth';

async function cambRequest<T>({
    apiKey,
    method,
    path,
    body,
    responseType,
}: {
    apiKey: string;
    method: HttpMethod;
    path: string;
    body?: unknown;
    responseType?: 'arraybuffer' | 'json';
}): Promise<{ body: T; headers: Record<string, string | string[] | undefined> }> {
    const headers: Record<string, string> = { 'x-api-key': apiKey };
    if (responseType !== 'arraybuffer') {
        headers['Accept'] = 'application/json';
    }
    if (body !== undefined && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    const response = await httpClient.sendRequest<T>({
        method,
        url: `${API_BASE_URL}${path}`,
        headers,
        body,
        responseType,
    });
    return { body: response.body, headers: response.headers ?? {} };
}

class CambApiError extends Error {
    readonly httpStatus: number;
    readonly responseBody: unknown;
    constructor({ message, httpStatus, responseBody }: { message: string; httpStatus: number; responseBody: unknown }) {
        super(message);
        this.httpStatus = httpStatus;
        this.responseBody = responseBody;
        this.name = 'CambApiError';
    }
}

function shortVendorMessage(body: unknown): string {
    if (typeof body === 'string') {
        return body.trim().slice(0, 200);
    }
    if (isRecord(body)) {
        for (const key of ['message', 'detail', 'payload', 'error']) {
            const value = body[key];
            if (typeof value === 'string' && value.trim() !== '') {
                return value.trim().slice(0, 200);
            }
            if (isRecord(value) && typeof value['message'] === 'string') {
                return value['message'].trim().slice(0, 200);
            }
            if (Array.isArray(value) && isRecord(value[0]) && typeof value[0]['msg'] === 'string') {
                return value[0]['msg'].trim().slice(0, 200);
            }
        }
    }
    return '';
}

async function withErrorContext<T>({ operation, fn }: { operation: string; fn: () => Promise<T> }): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof HttpError) {
            const { status, body } = error.response;
            const detail = shortVendorMessage(body);
            throw new CambApiError({ message: `Camb.AI ${operation} failed (HTTP ${status}${detail ? `: ${detail}` : ''}).`, httpStatus: status, responseBody: body });
        }
        throw error;
    }
}

function isTransientPollError(error: unknown): boolean {
    if (error instanceof CambApiError) {
        return error.httpStatus === 429 || error.httpStatus >= 500;
    }
    if (error instanceof HttpError) {
        return error.response.status === 429 || error.response.status >= 500;
    }
    return error instanceof TypeError || (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'));
}

function isRetryable(error: unknown): boolean {
    if (error instanceof HttpError) {
        const status = error.response.status;
        return status === 429 || status >= 500;
    }
    return error instanceof Error;
}

async function withRetry<T>({ fn, delaysMs }: { fn: () => Promise<T>; delaysMs: number[] }): Promise<T> {
    for (const delay of delaysMs) {
        try {
            return await fn();
        } catch (error) {
            if (!isRetryable(error)) {
                throw error;
            }
            await sleep(delay);
        }
    }
    return fn();
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTaskStatus({
    apiKey,
    taskType,
    taskId,
}: {
    apiKey: string;
    taskType: string;
    taskId: string;
}): Promise<{ status: string; run_id: string | null }> {
    if (!TASK_TYPES.includes(taskType)) {
        throw new Error(`Unknown task type "${taskType}". Use one of: ${TASK_TYPES.join(', ')}.`);
    }
    const response = await withErrorContext({
        operation: `${TASK_LABELS[taskType] ?? taskType} status check for task ${taskId}`,
        fn: () =>
            cambRequest<{ status?: string; run_id?: number | string | null }>({
                apiKey,
                method: HttpMethod.GET,
                path: `/${taskType}/${encodeURIComponent(taskId)}`,
            }),
    }).catch((error: unknown) => {
        if (error instanceof CambApiError && (error.httpStatus === 403 || error.httpStatus === 404)) {
            throw new CambApiError({ message: `${error.message} Check that task ID ${taskId} is correct, that the task type is ${TASK_LABELS[taskType] ?? taskType}, and that the task belongs to this Camb.AI account.`, httpStatus: error.httpStatus, responseBody: error.responseBody });
        }
        throw error;
    });
    const runId = response.body.run_id;
    return {
        status: response.body.status ?? 'UNKNOWN',
        run_id: runId === null || runId === undefined ? null : String(runId),
    };
}

async function pollTask({
    apiKey,
    taskType,
    taskId,
    maxAttempts,
    intervalMs,
    label,
}: {
    apiKey: string;
    taskType: string;
    taskId: string;
    maxAttempts: number;
    intervalMs: number;
    label: string;
}): Promise<string> {
    let consecutiveTransient = 0;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const outcome = await getTaskStatus({ apiKey, taskType, taskId }).then(
            (value) => ({ value, error: undefined }),
            (error: unknown) => ({ value: undefined, error })
        );
        if (outcome.value === undefined) {
            if (!isTransientPollError(outcome.error)) {
                throw outcome.error;
            }
            consecutiveTransient++;
            if (consecutiveTransient >= MAX_CONSECUTIVE_POLL_ERRORS) {
                const reason = outcome.error instanceof Error ? ` Last error: ${outcome.error.message}` : '';
                throw new Error(`${label} task ${taskId} could not be checked: Camb.AI status checks failed ${consecutiveTransient} times in a row.${reason} The task may still finish and credits may already be spent; check it later with Get Task Status using task ID ${taskId}.`);
            }
            if (attempt < maxAttempts - 1) {
                await sleep(intervalMs);
            }
            continue;
        }
        consecutiveTransient = 0;
        const { status, run_id } = outcome.value;
        if (status === 'SUCCESS') {
            if (!run_id) {
                throw new Error(`${label} task ${taskId} succeeded but Camb.AI returned no run_id.`);
            }
            return run_id;
        }
        if (status === 'PAYMENT_REQUIRED') {
            throw new Error(`${label} task ${taskId} stopped: insufficient credits on the Camb.AI account (PAYMENT_REQUIRED). Top up credits and try again.`);
        }
        if (status === 'ERROR' || status === 'FAILED') {
            throw new Error(`${label} task ${taskId} failed on Camb.AI (status ${status}).`);
        }
        if (status === 'TIMEOUT') {
            throw new Error(`${label} task ${taskId} timed out on Camb.AI (status TIMEOUT).`);
        }
        if (attempt < maxAttempts - 1) {
            await sleep(intervalMs);
        }
    }
    throw new Error(`${label} task ${taskId} is still processing after ${Math.round((maxAttempts * intervalMs) / 1000)} seconds. Credits may already be spent; check it later with Get Task Status using task ID ${taskId}, then fetch the output with Get Run Result.`);
}

async function createTask({
    apiKey,
    path,
    body,
    label,
}: {
    apiKey: string;
    path: string;
    body: unknown;
    label: string;
}): Promise<string> {
    const response = await withErrorContext({
        operation: `${label} request`,
        fn: () => cambRequest<{ task_id?: string }>({ apiKey, method: HttpMethod.POST, path, body }),
    });
    const taskId = response.body.task_id;
    if (!taskId) {
        throw new Error(`Camb.AI ${label} request returned no task_id.`);
    }
    return String(taskId);
}

function extensionFromContentType(headers: Record<string, string | string[] | undefined>): string {
    const raw = headers['content-type'] ?? headers['Content-Type'];
    const value = (Array.isArray(raw) ? raw[0] : raw ?? '').toLowerCase();
    if (value.includes('mpeg') || value.includes('mp3')) return 'mp3';
    if (value.includes('flac')) return 'flac';
    if (value.includes('ogg')) return 'ogg';
    if (value.includes('aac')) return 'aac';
    if (value.includes('mp4')) return 'm4a';
    return 'wav';
}

async function downloadAudio({
    apiKey,
    path,
    files,
    filePrefix,
    runId,
    label,
}: {
    apiKey: string;
    path: string;
    files: FilesService;
    filePrefix: string;
    runId: string;
    label: string;
}): Promise<string> {
    const response = await withErrorContext({
        operation: `${label} result download for run ${runId}`,
        fn: () => cambRequest<Buffer>({ apiKey, method: HttpMethod.GET, path, responseType: 'arraybuffer' }),
    });
    const data = Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body);
    return files.write({
        fileName: `${filePrefix}_${runId}.${extensionFromContentType(response.headers)}`,
        data,
    });
}

function compact(payload: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
}

async function runTts({
    apiKey,
    files,
    text,
    language,
    voiceId,
    gender,
    age,
    projectName,
    projectDescription,
    folderId,
}: {
    apiKey: string;
    files: FilesService;
    text: string;
    language: number;
    voiceId: number;
    gender?: number;
    age?: number;
    projectName?: string;
    projectDescription?: string;
    folderId?: number;
}) {
    const taskId = await createTask({
        apiKey,
        path: '/tts',
        label: 'Text-to-Speech',
        body: compact({
            text,
            language,
            voice_id: voiceId,
            gender,
            age: age || undefined,
            project_name: projectName,
            project_description: projectDescription,
            folder_id: folderId,
        }),
    });
    const runId = await pollTask({ apiKey, taskType: 'tts', taskId, maxAttempts: SHORT_TASK_ATTEMPTS, intervalMs: POLLING_INTERVAL_MS, label: 'Text-to-Speech' });
    const audioUrl = await downloadAudio({ apiKey, path: `/tts-result/${runId}`, files, filePrefix: 'speech', runId, label: 'Text-to-Speech' });
    return { message: 'Speech generated successfully.', audio_url: audioUrl, run_id: runId, task_id: taskId };
}

async function runTextToSound({
    apiKey,
    files,
    prompt,
    duration,
    projectName,
    projectDescription,
    folderId,
}: {
    apiKey: string;
    files: FilesService;
    prompt: string;
    duration?: number;
    projectName?: string;
    projectDescription?: string;
    folderId?: number;
}) {
    if (duration !== undefined && (!Number.isFinite(duration) || duration <= 0 || duration > 10)) {
        throw new Error('Duration must be a number of seconds between 0 and 10.');
    }
    const taskId = await createTask({
        apiKey,
        path: '/text-to-sound',
        label: 'Text-to-Sound',
        body: compact({
            prompt,
            duration,
            project_name: projectName,
            project_description: projectDescription,
            folder_id: folderId,
        }),
    });
    const runId = await pollTask({ apiKey, taskType: 'text-to-sound', taskId, maxAttempts: SHORT_TASK_ATTEMPTS, intervalMs: POLLING_INTERVAL_MS, label: 'Text-to-Sound' });
    const audioUrl = await downloadAudio({ apiKey, path: `/text-to-sound-result/${runId}`, files, filePrefix: 'sound', runId, label: 'Text-to-Sound' });
    return { audio_url: audioUrl, run_id: runId, task_id: taskId };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function getRunResult({
    apiKey,
    taskType,
    runId,
}: {
    apiKey: string;
    taskType: string;
    runId: string;
}): Promise<unknown> {
    const path = RESULT_PATHS[taskType];
    if (!path) {
        throw new Error(`Unknown result type "${taskType}". Use one of: ${Object.keys(RESULT_PATHS).join(', ')}.`);
    }
    const response = await withErrorContext({
        operation: `${RESULT_LABELS[taskType] ?? taskType} result fetch for run ${runId}`,
        fn: () => cambRequest<unknown>({ apiKey, method: HttpMethod.GET, path: `/${path}/${encodeURIComponent(runId)}` }),
    });
    return response.body;
}

async function runTranslation({
    apiKey,
    texts,
    sourceLanguage,
    targetLanguage,
    formality,
    gender,
    age,
    projectName,
    projectDescription,
    folderId,
}: {
    apiKey: string;
    texts: string;
    sourceLanguage: number;
    targetLanguage: number;
    formality?: number;
    gender?: number;
    age?: number;
    projectName?: string;
    projectDescription?: string;
    folderId?: number;
}) {
    const segments = texts.split('\n').filter((line) => line.trim().length > 0);
    if (segments.length === 0) {
        throw new Error('Text to translate is empty.');
    }
    const taskId = await createTask({
        apiKey,
        path: '/translate',
        label: 'Translation',
        body: compact({
            texts: segments,
            source_language: sourceLanguage,
            target_language: targetLanguage,
            formality,
            gender,
            age: age || undefined,
            project_name: projectName,
            project_description: projectDescription,
            folder_id: folderId,
        }),
    });
    const runId = await pollTask({ apiKey, taskType: 'translate', taskId, maxAttempts: SHORT_TASK_ATTEMPTS, intervalMs: POLLING_INTERVAL_MS, label: 'Translation' });
    const body = await getRunResult({ apiKey, taskType: 'translation', runId });
    const record = isRecord(body) ? body : {};
    const translations = Array.isArray(record['translations'])
        ? record['translations']
        : Array.isArray(record['texts'])
            ? record['texts']
            : Array.isArray(body)
                ? body
                : [];
    return { ...record, translations, run_id: runId, task_id: taskId };
}

async function runTranscription({
    apiKey,
    language,
    mediaUrl,
    mediaFile,
    projectName,
    projectDescription,
    folderId,
}: {
    apiKey: string;
    language: number;
    mediaUrl?: string;
    mediaFile?: { data: Buffer; filename: string };
    projectName?: string;
    projectDescription?: string;
    folderId?: number;
}) {
    const form = new FormData();
    form.append('language', String(language));
    if (projectName) form.append('project_name', projectName);
    if (projectDescription) form.append('project_description', projectDescription);
    if (folderId !== undefined) form.append('folder_id', String(folderId));
    if (mediaFile) {
        form.append('media_file', new Blob([new Uint8Array(mediaFile.data)]), mediaFile.filename);
    } else if (mediaUrl) {
        form.append('media_url', mediaUrl);
    } else {
        throw new Error('Provide a media file or a media URL to transcribe.');
    }
    const taskId = await createTask({ apiKey, path: '/transcribe', label: 'Transcription', body: form });
    const runId = await pollTask({ apiKey, taskType: 'transcribe', taskId, maxAttempts: LONG_TASK_ATTEMPTS, intervalMs: POLLING_INTERVAL_MS, label: 'Transcription' });
    const body = await getRunResult({ apiKey, taskType: 'transcription', runId });
    const record = isRecord(body) ? body : {};
    const transcript = Array.isArray(body) ? body : Array.isArray(record['transcript']) ? record['transcript'] : [];
    return { ...record, transcript, run_id: runId, task_id: taskId };
}

async function startDubbing({
    apiKey,
    videoUrl,
    sourceLanguage,
    targetLanguages,
    projectName,
    projectDescription,
    transcriptionMode,
    includeMusicInForeground,
}: {
    apiKey: string;
    videoUrl: string;
    sourceLanguage: string;
    targetLanguages: string[];
    projectName?: string;
    projectDescription?: string;
    transcriptionMode?: string;
    includeMusicInForeground?: boolean;
}): Promise<string> {
    if (targetLanguages.length === 0) {
        throw new Error('Provide at least one target language.');
    }
    if (transcriptionMode && !['fast', 'slow'].includes(transcriptionMode)) {
        throw new Error('Transcription mode must be "fast" or "slow".');
    }
    return createTask({
        apiKey,
        path: '/dub',
        label: 'Dubbing',
        body: compact({
            video_url: videoUrl,
            source_language: sourceLanguage,
            target_languages: targetLanguages,
            project_name: projectName,
            project_description: projectDescription,
            transcription_mode: transcriptionMode,
            include_music_in_fg: includeMusicInForeground,
        }),
    });
}

async function getDubResult({ apiKey, runId }: { apiKey: string; runId: string }) {
    const body = await getRunResult({ apiKey, taskType: 'dub', runId });
    const record = isRecord(body) ? body : {};
    return {
        video_url: typeof record['video_url'] === 'string' ? record['video_url'] : null,
        audio_url: typeof record['audio_url'] === 'string' ? record['audio_url'] : null,
        transcript: Array.isArray(record['transcript']) ? record['transcript'] : [],
    };
}

async function runDubbing(params: {
    apiKey: string;
    videoUrl: string;
    sourceLanguage: string;
    targetLanguages: string[];
    projectName?: string;
    projectDescription?: string;
    transcriptionMode?: string;
    includeMusicInForeground?: boolean;
    waitForCompletion: boolean;
}) {
    const taskId = await startDubbing(params);
    if (!params.waitForCompletion) {
        return { task_id: taskId, status: 'PENDING', run_id: null, video_url: null, audio_url: null, transcript: [] };
    }
    const runId = await pollTask({ apiKey: params.apiKey, taskType: 'dub', taskId, maxAttempts: DUB_TASK_ATTEMPTS, intervalMs: LONG_POLLING_INTERVAL_MS, label: 'Dubbing' });
    const result = await getDubResult({ apiKey: params.apiKey, runId });
    return { task_id: taskId, status: 'SUCCESS', run_id: runId, ...result };
}

async function listVoices({ apiKey, retry }: { apiKey: string; retry?: boolean }): Promise<Voice[]> {
    const response = await withErrorContext({
        operation: 'list voices',
        fn: () => withRetry({ fn: () => cambRequest<Voice[]>({ apiKey, method: HttpMethod.GET, path: '/list-voices' }), delaysMs: retry ? DROPDOWN_RETRY_DELAYS_MS : [] }),
    });
    return Array.isArray(response.body) ? response.body : [];
}

async function listLanguages({ apiKey, retry, kind }: { apiKey: string; retry?: boolean; kind: 'source' | 'target' }): Promise<Language[]> {
    const response = await withErrorContext({
        operation: `list ${kind} languages`,
        fn: () => withRetry({ fn: () => cambRequest<Language[]>({ apiKey, method: HttpMethod.GET, path: `/${kind}-languages` }), delaysMs: retry ? DROPDOWN_RETRY_DELAYS_MS : [] }),
    });
    return Array.isArray(response.body) ? response.body : [];
}

async function listFolders({ apiKey, retry }: { apiKey: string; retry?: boolean }): Promise<Folder[]> {
    const response = await withErrorContext({
        operation: 'list folders',
        fn: () => withRetry({ fn: () => cambRequest<Folder[]>({ apiKey, method: HttpMethod.GET, path: '/folders' }), delaysMs: retry ? DROPDOWN_RETRY_DELAYS_MS : [] }),
    });
    return Array.isArray(response.body) ? response.body : [];
}

async function createFolder({ apiKey, folderName }: { apiKey: string; folderName: string }) {
    const name = folderName.trim();
    if (name.length < 3 || name.length > 255) {
        throw new Error('Folder name must be between 3 and 255 characters.');
    }
    const response = await withErrorContext({
        operation: 'create folder',
        fn: () =>
            cambRequest<{ status?: string; folder_id?: number; folder_name?: string; message?: string }>({
                apiKey,
                method: HttpMethod.POST,
                path: '/folders/create',
                body: { folder_name: name },
            }),
    });
    return {
        status: response.body.status ?? null,
        folder_id: response.body.folder_id ?? null,
        folder_name: response.body.folder_name ?? name,
        message: response.body.message ?? null,
    };
}

async function resolveLanguageId({
    apiKey,
    value,
    kind,
}: {
    apiKey: string;
    value: string;
    kind: 'source' | 'target';
}): Promise<number> {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
        return Number(trimmed);
    }
    const needle = trimmed.toLowerCase();
    const languages = await listLanguages({ apiKey, kind });
    const match = languages.find(
        (lang) => lang.short_name?.toLowerCase() === needle || lang.language?.toLowerCase() === needle
    );
    if (!match) {
        throw new Error(`Unknown ${kind} language "${trimmed}". Call List ${kind === 'source' ? 'Source' : 'Target'} Languages and pass its id or short_name.`);
    }
    return match.id;
}

function parseOptionalInteger({ value, field }: { value: string | undefined; field: string }): number | undefined {
    if (value === undefined || value.trim() === '') {
        return undefined;
    }
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
        throw new Error(`${field} must be a numeric ID, got "${trimmed}".`);
    }
    return Number(trimmed);
}

function parseRequiredInteger({ value, field }: { value: string; field: string }): number {
    const parsed = parseOptionalInteger({ value, field });
    if (parsed === undefined) {
        throw new Error(`${field} is required.`);
    }
    return parsed;
}

function mapEnum({ value, map, field }: { value: string | undefined; map: Record<string, number>; field: string }): number | undefined {
    if (value === undefined || value === '') {
        return undefined;
    }
    const mapped = map[value.trim().toLowerCase()];
    if (mapped === undefined) {
        throw new Error(`${field} must be one of: ${Object.keys(map).join(', ')}.`);
    }
    return mapped;
}

function splitList(value: string): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function apiKeyFrom(auth: { secret_text: string }): string {
    return auth.secret_text;
}

function languageDropdown({ kind, displayName, description, valueField }: { kind: 'source' | 'target'; displayName: string; description: string; valueField: 'id' }) {
    return Property.Dropdown({
        auth: cambaiAuth,
        displayName,
        description,
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, options: [], placeholder: 'Please authenticate first' };
            }
            try {
                const languages = await listLanguages({ apiKey: auth.secret_text, kind, retry: true });
                return {
                    disabled: false,
                    options: languages.map((lang) => ({ label: `${lang.language} (${lang.short_name})`, value: lang[valueField] })),
                };
            } catch (error) {
                return { disabled: true, options: [], placeholder: 'Could not load languages. Check your connection.' };
            }
        },
    });
}

export const listVoicesDropdown = Property.Dropdown({
    auth: cambaiAuth,
    displayName: 'Voice',
    description: 'Select the voice to generate the speech.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, options: [], placeholder: 'Please authenticate first' };
        }
        try {
            const voices = await listVoices({ apiKey: auth.secret_text, retry: true });
            return {
                disabled: false,
                options: voices.map((voice) => ({ label: voice.voice_name, value: voice.id })),
            };
        } catch (error) {
            return { disabled: true, options: [], placeholder: 'Could not load voices. Check your connection.' };
        }
    },
});

export const listSourceLanguagesDropdown = languageDropdown({
    kind: 'source',
    displayName: 'Source Language',
    description: 'Select the original language of the input text.',
    valueField: 'id',
});

export const listTargetLanguagesDropdown = languageDropdown({
    kind: 'target',
    displayName: 'Target Language',
    description: 'Select the language to translate the text into.',
    valueField: 'id',
});

export const dubSourceLocaleDropdown = Property.Dropdown({
    auth: cambaiAuth,
    displayName: 'Source Language',
    description: 'The language spoken in the video.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, options: [], placeholder: 'Please authenticate first' };
        }
        try {
            const languages = await listLanguages({ apiKey: auth.secret_text, kind: 'source', retry: true });
            return {
                disabled: false,
                options: languages.map((lang) => ({ label: `${lang.language} (${lang.short_name})`, value: lang.short_name })),
            };
        } catch (error) {
            return { disabled: true, options: [], placeholder: 'Could not load languages. Check your connection.' };
        }
    },
});

export const dubTargetLocalesDropdown = Property.MultiSelectDropdown({
    auth: cambaiAuth,
    displayName: 'Target Languages',
    description: 'The languages to dub the video into.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, options: [], placeholder: 'Please authenticate first' };
        }
        try {
            const languages = await listLanguages({ apiKey: auth.secret_text, kind: 'target', retry: true });
            return {
                disabled: false,
                options: languages.map((lang) => ({ label: `${lang.language} (${lang.short_name})`, value: lang.short_name })),
            };
        } catch (error) {
            return { disabled: true, options: [], placeholder: 'Could not load languages. Check your connection.' };
        }
    },
});

export const listFoldersDropdown = Property.Dropdown({
    displayName: 'Folder',
    auth: cambaiAuth,
    description: 'Select the folder to save the task in.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, options: [], placeholder: 'Please authenticate first' };
        }
        try {
            const folders = await listFolders({ apiKey: auth.secret_text, retry: true });
            return {
                disabled: false,
                options: folders.map((folder) => ({ label: folder.folder_name, value: folder.folder_id })),
            };
        } catch (error) {
            return { disabled: true, options: [], placeholder: 'Could not load folders.' };
        }
    },
});

const transcriptSegmentFields: OutputSchemaField[] = [
    { key: 'start', label: 'Start', format: 'number', description: 'Segment start time in seconds.' },
    { key: 'end', label: 'End', format: 'number', description: 'Segment end time in seconds.' },
    { key: 'text', label: 'Text' },
    { key: 'speaker', label: 'Speaker' },
];

const runIdField: OutputSchemaField = { key: 'run_id', label: 'Run ID', description: 'Use with Get Run Result.' };
const taskIdField: OutputSchemaField = { key: 'task_id', label: 'Task ID', description: 'Use with Get Task Status.' };

const languageItemFields: OutputSchemaField[] = [
    { key: 'id', label: 'ID', format: 'number', description: 'Numeric language ID used by text-to-speech, translation and transcription.' },
    { key: 'language', label: 'Language' },
    { key: 'short_name', label: 'Locale Tag', description: 'Locale tag such as en-us, used by dubbing.' },
];

export const cambOutputSchemas: Record<string, OutputSchema> = {
    textToSpeech: {
        fields: [
            { key: 'message', label: 'Message' },
            { key: 'audio_url', label: 'Audio File', format: 'url' },
            runIdField,
            taskIdField,
        ],
    },
    textToSound: {
        fields: [{ key: 'audio_url', label: 'Audio File', format: 'url' }, runIdField, taskIdField],
    },
    translation: {
        fields: [{ key: 'translations', label: 'Translations', description: 'One translated string per input line.' }, runIdField, taskIdField],
    },
    transcription: {
        fields: [{ key: 'transcript', label: 'Transcript', listItems: transcriptSegmentFields, labelKey: 'text' }, runIdField, taskIdField],
    },
    dubbing: {
        fields: [
            taskIdField,
            { key: 'status', label: 'Status', description: 'SUCCESS when waited for, otherwise PENDING.' },
            runIdField,
            { key: 'video_url', label: 'Dubbed Video URL', format: 'url' },
            { key: 'audio_url', label: 'Dubbed Audio URL', format: 'url' },
            { key: 'transcript', label: 'Transcript', listItems: transcriptSegmentFields, labelKey: 'text' },
        ],
    },
    dubbingAi: {
        fields: [taskIdField],
    },
    listVoices: {
        fields: [
            {
                key: 'voices',
                label: 'Voices',
                labelKey: 'voice_name',
                listItems: [
                    { key: 'id', label: 'Voice ID', format: 'number' },
                    { key: 'voice_name', label: 'Name' },
                    { key: 'gender', label: 'Gender', format: 'number', description: '1 male, 2 female, 0 neutral, 9 unspecified.' },
                    { key: 'age', label: 'Age', format: 'number' },
                    { key: 'language', label: 'Language' },
                ],
            },
        ],
    },
    listLanguages: {
        fields: [{ key: 'languages', label: 'Languages', labelKey: 'language', listItems: languageItemFields }],
    },
    listFolders: {
        fields: [
            {
                key: 'folders',
                label: 'Folders',
                labelKey: 'folder_name',
                listItems: [
                    { key: 'folder_id', label: 'Folder ID', format: 'number' },
                    { key: 'folder_name', label: 'Folder Name' },
                ],
            },
        ],
    },
    taskStatus: {
        fields: [
            { key: 'status', label: 'Status', description: 'SUCCESS, PENDING, TIMEOUT, ERROR or PAYMENT_REQUIRED.' },
            { key: 'run_id', label: 'Run ID', description: 'May be set before SUCCESS; use it only once status is SUCCESS.' },
        ],
    },
    runResult: {
        fields: [{ key: 'result', label: 'Result', description: 'The raw result object for the run.' }],
    },
    createFolder: {
        fields: [
            { key: 'status', label: 'Status' },
            { key: 'folder_id', label: 'Folder ID', format: 'number' },
            { key: 'folder_name', label: 'Folder Name' },
            { key: 'message', label: 'Message' },
        ],
    },
};

export const cambCommon = {
    apiKeyFrom,
    pollTask,
    getTaskStatus,
    getRunResult,
    runTts,
    runTextToSound,
    runTranslation,
    runTranscription,
    startDubbing,
    getDubResult,
    runDubbing,
    listVoices,
    listLanguages,
    listFolders,
    createFolder,
    resolveLanguageId,
    parseOptionalInteger,
    parseRequiredInteger,
    mapEnum,
    splitList,
};

type Voice = {
    id: number;
    voice_name: string;
    gender?: number | null;
    age?: number | null;
    language?: string | null;
};

type Folder = {
    folder_id: number;
    folder_name: string;
};

type Language = {
    id: number;
    language: string;
    short_name: string;
};

export const API_BASE_URL = 'https://client.camb.ai/apis';
export const POLLING_INTERVAL_MS = 5000;
export const LONG_POLLING_INTERVAL_MS = 10000;
export const SHORT_TASK_ATTEMPTS = 60;
export const LONG_TASK_ATTEMPTS = 100;
export const DUB_TASK_ATTEMPTS = 54;
export const TASK_TYPES = ['tts', 'text-to-sound', 'translate', 'transcribe', 'dub'];
export const RESULT_PATHS: Record<string, string> = {
    translation: 'translation-result',
    transcription: 'transcription-result',
    dub: 'dub-result',
};
export const MAX_CONSECUTIVE_POLL_ERRORS = 3;
export const DROPDOWN_RETRY_DELAYS_MS = [500, 1500];
export const TASK_LABELS: Record<string, string> = {
    tts: 'Text-to-Speech',
    'text-to-sound': 'Text-to-Sound',
    translate: 'Translation',
    transcribe: 'Transcription',
    dub: 'Dubbing',
};
export const RESULT_LABELS: Record<string, string> = { translation: 'Translation', transcription: 'Transcription', dub: 'Dubbing' };
export const GENDER_VALUES: Record<string, number> = { male: 1, female: 2, neutral: 0, unspecified: 9 };
export const FORMALITY_VALUES: Record<string, number> = { formal: 1, informal: 2 };
