import { httpClient, HttpError } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cambAi } from '../src/index';
import { cambCommon, listFoldersDropdown, DUB_TASK_ATTEMPTS, LONG_POLLING_INTERVAL_MS, LONG_TASK_ATTEMPTS, POLLING_INTERVAL_MS, SHORT_TASK_ATTEMPTS } from '../src/lib/common';
import { createTextToSpeech } from '../src/lib/actions/create-text-to-speech';
import { createTextToSpeechAi } from '../src/lib/actions/ai/create-text-to-speech-ai';
import { createTranslation } from '../src/lib/actions/create-translation';
import { createTranslationAi } from '../src/lib/actions/ai/create-translation-ai';
import { createTextToSound } from '../src/lib/actions/create-text-to-sound';
import { createTranscriptionAi } from '../src/lib/actions/ai/create-transcription-ai';
import { createTranscription } from '../src/lib/actions/create-transcription';
import { createDubbingAi } from '../src/lib/actions/ai/create-dubbing-ai';
import { createDubbing } from '../src/lib/actions/create-dubbing';
import { listVoices } from '../src/lib/actions/list-voices';
import { createFolder } from '../src/lib/actions/create-folder';
import { getTaskStatus } from '../src/lib/actions/get-task-status';
import { getRunResult } from '../src/lib/actions/get-run-result';

const KEY = 'k-123';
const BASE = 'https://client.camb.ai/apis';

type Reply = { match: string; body: unknown; headers?: Record<string, string> };

function mockRoutes({ replies }: { replies: Reply[] }) {
    const queue = [...replies];
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
        const index = queue.findIndex((reply) => `${request.method} ${request.url}` === reply.match);
        if (index === -1) {
            throw new Error(`unexpected request ${request.method} ${request.url}`);
        }
        const [reply] = queue.splice(index, 1);
        return { status: 200, headers: reply.headers ?? {}, body: reply.body };
    });
}

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }) {
    const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
    const written: { fileName: string; data: unknown }[] = [];
    const files = {
        write: async ({ fileName, data }: { fileName: string; data: unknown }) => {
            written.push({ fileName, data });
            return `file://${fileName}`;
        },
        upload: async () => ({ id: 'x', url: 'x' }),
    };
    const runFn = action.run;
    if (typeof runFn !== 'function') throw new Error('no run');
    const result = Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: { secret_text: KEY }, files }]));
    return { result, written };
}

function bodyOf({ spy, match }: { spy: ReturnType<typeof mockRoutes>; match: string }): unknown {
    const call = spy.mock.calls.find(([request]) => `${request.method} ${request.url}` === match);
    return call?.[0].body;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('piece metadata', () => {
    const actions = Object.values(cambAi.actions());

    it('has 18 actions with the planned audience split', () => {
        expect(actions).toHaveLength(18);
        const count = (audience: string) => actions.filter((a) => (a.audience ?? 'human') === audience).length;
        expect(count('human')).toBe(6);
        expect(count('ai')).toBe(9);
        expect(count('both')).toBe(3);
    });

    it('every non-custom action has an outputSchema and agent actions have aiMetadata', () => {
        for (const action of actions) {
            if (action.name === 'custom_api_call') continue;
            expect(action.outputSchema, action.name).toBeDefined();
            if (action.audience !== 'human') expect(action.aiMetadata?.description, action.name).toBeTruthy();
        }
    });

    it('twins share the human outputSchema', () => {
        const byName = cambAi.actions();
        for (const name of ['create_text_to_speech', 'create_text_to_sound', 'create_translation', 'create_transcription']) {
            expect(byName[`${name}_ai`].outputSchema, name).toEqual(byName[name].outputSchema);
        }
    });

    it('agent actions have no dynamic dropdowns, arrays, numeric dropdowns or enum defaults', () => {
        for (const action of actions) {
            if (action.audience === 'human') continue;
            for (const [key, prop] of Object.entries(action.props)) {
                expect(['DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'ARRAY', 'DYNAMIC', 'FILE'], `${action.name}.${key}`).not.toContain(prop.type);
                if (prop.type === 'STATIC_DROPDOWN') {
                    expect('defaultValue' in prop ? prop.defaultValue : undefined).toBeUndefined();
                    for (const option of prop.options.options) expect(typeof option.value, `${action.name}.${key}`).toBe('string');
                }
            }
        }
    });

    it('creates are WRITE and not idempotent, lists/gets are idempotent', () => {
        for (const action of actions) {
            if (action.name.startsWith('create_')) expect(action.classification, action.name).toBe('WRITE');
            if (action.audience === 'human' || !action.aiMetadata) continue;
            expect(action.aiMetadata.idempotent, action.name).toBe(!action.name.startsWith('create_'));
        }
    });
});

describe('pollTask', () => {
    const poll = () => cambCommon.pollTask({ apiKey: KEY, taskType: 'tts', taskId: 't1', maxAttempts: 3, intervalMs: 0, label: 'Text-to-Speech' });

    it('keeps polling on PENDING and returns run_id on SUCCESS', async () => {
        const spy = mockRoutes({
            replies: [
                { match: `GET ${BASE}/tts/t1`, body: { status: 'PENDING', run_id: null } },
                { match: `GET ${BASE}/tts/t1`, body: { status: 'SUCCESS', run_id: 77 } },
            ],
        });
        await expect(poll()).resolves.toBe('77');
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it.each([
        ['PAYMENT_REQUIRED', /insufficient credits/],
        ['ERROR', /t1 failed/],
        ['FAILED', /t1 failed/],
        ['TIMEOUT', /t1 timed out/],
    ])('stops on %s', async (status, message) => {
        const spy = mockRoutes({ replies: [{ match: `GET ${BASE}/tts/t1`, body: { status } }] });
        await expect(poll()).rejects.toThrow(message);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('reports the task id at the attempt cap', async () => {
        const pending = { match: `GET ${BASE}/tts/t1`, body: { status: 'PENDING' } };
        const spy = mockRoutes({ replies: [pending, pending, pending] });
        await expect(poll()).rejects.toThrow(/task ID t1, then fetch the output with Get Run Result/);
        expect(spy).toHaveBeenCalledTimes(3);
    });

    it('hints at a wrong or foreign task id on 403 Access Denied', async () => {
        vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError(undefined, { status: 403, responseBody: { detail: 'Access Denied' } }));
        await expect(poll()).rejects.toThrow(/HTTP 403.*Check that task ID t1 is correct.*belongs to this Camb\.AI account/);
    });

    it('treats one 503 during polling as pending and then returns run_id', async () => {
        const spy = vi.spyOn(httpClient, 'sendRequest')
            .mockRejectedValueOnce(new HttpError(undefined, { status: 503, responseBody: 'busy' }))
            .mockResolvedValueOnce({ status: 200, headers: {}, body: { status: 'SUCCESS', run_id: 42 } });
        await expect(poll()).resolves.toBe('42');
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('treats a network error during polling as pending', async () => {
        vi.spyOn(httpClient, 'sendRequest')
            .mockRejectedValueOnce(new TypeError('fetch failed'))
            .mockResolvedValueOnce({ status: 200, headers: {}, body: { status: 'SUCCESS', run_id: 43 } });
        await expect(poll()).resolves.toBe('43');
    });

    it('gives up after 3 consecutive 503s with the task id', async () => {
        const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError(undefined, { status: 503, responseBody: 'busy' }));
        await expect(cambCommon.pollTask({ apiKey: KEY, taskType: 'tts', taskId: 't1', maxAttempts: 10, intervalMs: 0, label: 'Text-to-Speech' }))
            .rejects.toThrow(/failed 3 times in a row.*check it later with Get Task Status using task ID t1/);
        expect(spy).toHaveBeenCalledTimes(3);
    });

    it('fails at once on a 403 during polling', async () => {
        const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError(undefined, { status: 403, responseBody: { detail: 'Access Denied' } }));
        await expect(poll()).rejects.toThrow(/HTTP 403: Access Denied/);
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('wraps HTTP errors with the operation', async () => {
        vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError(undefined, { status: 404, responseBody: { detail: 'nope' } }));
        await expect(poll()).rejects.toThrow('Camb.AI Text-to-Speech status check for task t1 failed (HTTP 404: nope).');
    });
});

describe('error messages and dropdown retry', () => {
    it('shows the short vendor message and keeps the full body in responseBody', async () => {
        const body = { payload: 'Access Denied', code: 'X1', trace: 'abc' };
        vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError(undefined, { status: 403, responseBody: body }));
        const error = await cambCommon.getTaskStatus({ apiKey: KEY, taskType: 'dub', taskId: 'zz' }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
            expect(error.message).toMatch(/^Camb\.AI Dubbing status check for task zz failed \(HTTP 403: Access Denied\)\. Check that task ID zz/);
            expect(error.message).not.toContain('trace');
            expect('responseBody' in error ? error.responseBody : undefined).toEqual(body);
        }
    });

    it('dropdown retries a 429 then loads', async () => {
        const spy = vi.spyOn(httpClient, 'sendRequest')
            .mockRejectedValueOnce(new HttpError(undefined, { status: 429, responseBody: 'slow down' }))
            .mockResolvedValueOnce({ status: 200, headers: {}, body: [{ folder_id: 1, folder_name: 'A' }] });
        const out = await listFoldersDropdown.options({ auth: { secret_text: KEY } }, createMockActionContext<InputPropertyMap>({ propsValue: {} }));
        expect(out).toEqual({ disabled: false, options: [{ label: 'A', value: 1 }] });
        expect(spy).toHaveBeenCalledTimes(2);
    });

    it('dropdown does not retry a 401 and shows a readable error', async () => {
        const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError(undefined, { status: 401, responseBody: 'no' }));
        const out = await listFoldersDropdown.options({ auth: { secret_text: KEY } }, createMockActionContext<InputPropertyMap>({ propsValue: {} }));
        expect(out).toEqual({ disabled: true, options: [], placeholder: 'Could not load folders.' });
        expect(spy).toHaveBeenCalledTimes(1);
    });
});

describe('poll caps', () => {
    it('every waiting action stays under 9 minutes of polling', () => {
        const limit = 9 * 60 * 1000;
        expect(SHORT_TASK_ATTEMPTS * POLLING_INTERVAL_MS).toBeLessThanOrEqual(limit);
        expect(LONG_TASK_ATTEMPTS * POLLING_INTERVAL_MS).toBeLessThanOrEqual(limit - 30 * 1000);
        expect(DUB_TASK_ATTEMPTS * LONG_POLLING_INTERVAL_MS).toBeLessThanOrEqual(limit);
    });
});

describe('text-to-speech', () => {
    const replies = (): Reply[] => [
        { match: `POST ${BASE}/tts`, body: { task_id: 't1' } },
        { match: `GET ${BASE}/tts/t1`, body: { status: 'SUCCESS', run_id: 5 } },
        { match: `GET ${BASE}/tts-result/5`, body: Buffer.from('abc'), headers: { 'content-type': 'audio/mpeg' } },
    ];

    it('human action sends numeric values and names the file by content-type', async () => {
        const spy = mockRoutes({ replies: replies() });
        const { result, written } = run({ action: createTextToSpeech, propsValue: { text: 'hi', language: 1, voice_id: 20, gender: 2, folder_id: 3 } });
        await expect(result).resolves.toEqual({ message: 'Speech generated successfully.', audio_url: 'file://speech_5.mp3', run_id: '5', task_id: 't1' });
        expect(bodyOf({ spy, match: `POST ${BASE}/tts` })).toEqual({ text: 'hi', language: 1, voice_id: 20, gender: 2, folder_id: 3 });
        expect(written[0].fileName).toBe('speech_5.mp3');
    });

    it('ai twin resolves a locale tag and maps gender strings', async () => {
        const spy = mockRoutes({
            replies: [{ match: `GET ${BASE}/source-languages`, body: [{ id: 1, language: 'English (United States)', short_name: 'en-us' }] }, ...replies()],
        });
        const { result } = run({ action: createTextToSpeechAi, propsValue: { text: 'hi', language: 'EN-US', voice_id: '20', gender: 'female', folder_id: '' } });
        await result;
        expect(bodyOf({ spy, match: `POST ${BASE}/tts` })).toEqual({ text: 'hi', language: 1, voice_id: 20, gender: 2 });
    });

    it('ai twin rejects a non-numeric voice_id and an unknown language', async () => {
        mockRoutes({ replies: [] });
        await expect(run({ action: createTextToSpeechAi, propsValue: { text: 'hi', language: '1', voice_id: 'abc' } }).result).rejects.toThrow(/voice_id must be a numeric ID/);
        mockRoutes({ replies: [{ match: `GET ${BASE}/source-languages`, body: [] }] });
        await expect(run({ action: createTextToSpeechAi, propsValue: { text: 'hi', language: 'xx', voice_id: '1' } }).result).rejects.toThrow(/List Source Languages/);
    });
});

describe('translation', () => {
    const replies = (): Reply[] => [
        { match: `POST ${BASE}/translate`, body: { task_id: 't2' } },
        { match: `GET ${BASE}/translate/t2`, body: { status: 'SUCCESS', run_id: 9 } },
        { match: `GET ${BASE}/translation-result/9`, body: { translations: ['hola'] } },
    ];

    it('human action splits lines and returns translations with ids', async () => {
        const spy = mockRoutes({ replies: replies() });
        const { result } = run({ action: createTranslation, propsValue: { texts: 'hello\n\n', source_language: 1, target_language: 54, formality: 1, project_description: 'd' } });
        await expect(result).resolves.toEqual({ translations: ['hola'], run_id: '9', task_id: 't2' });
        expect(bodyOf({ spy, match: `POST ${BASE}/translate` })).toEqual({ texts: ['hello'], source_language: 1, target_language: 54, formality: 1, project_description: 'd' });
    });

    it('reads the live result shape {texts: [...]} into translations', async () => {
        mockRoutes({
            replies: [
                { match: `POST ${BASE}/translate`, body: { task_id: 't2' } },
                { match: `GET ${BASE}/translate/t2`, body: { status: 'SUCCESS', run_id: 9 } },
                { match: `GET ${BASE}/translation-result/9`, body: { texts: ['Hola, ¿cómo estás hoy?'] } },
            ],
        });
        const out = await run({ action: createTranslation, propsValue: { texts: 'Hello, how are you today?', source_language: 1, target_language: 54 } }).result;
        expect(out).toEqual({ texts: ['Hola, ¿cómo estás hoy?'], translations: ['Hola, ¿cómo estás hoy?'], run_id: '9', task_id: 't2' });
    });

    it('ai twin maps formality and gender strings and numeric language ids', async () => {
        const spy = mockRoutes({ replies: replies() });
        await run({ action: createTranslationAi, propsValue: { texts: 'hello', source_language: '1', target_language: '54', formality: 'informal', gender: 'neutral' } }).result;
        expect(bodyOf({ spy, match: `POST ${BASE}/translate` })).toEqual({ texts: ['hello'], source_language: 1, target_language: 54, formality: 2, gender: 0 });
    });

    it('ai twin rejects an unknown gender', async () => {
        mockRoutes({ replies: [] });
        await expect(run({ action: createTranslationAi, propsValue: { texts: 'a', source_language: '1', target_language: '2', gender: 'other' } }).result).rejects.toThrow(/gender must be one of/);
    });
});

describe('text-to-sound', () => {
    it('writes the audio to a file instead of returning raw bytes', async () => {
        mockRoutes({
            replies: [
                { match: `POST ${BASE}/text-to-sound`, body: { task_id: 't3' } },
                { match: `GET ${BASE}/text-to-sound/t3`, body: { status: 'SUCCESS', run_id: 4 } },
                { match: `GET ${BASE}/text-to-sound-result/4`, body: Buffer.from('x'), headers: { 'content-type': 'audio/wav' } },
            ],
        });
        const { result, written } = run({ action: createTextToSound, propsValue: { prompt: 'rain', duration: 2 } });
        await expect(result).resolves.toEqual({ audio_url: 'file://sound_4.wav', run_id: '4', task_id: 't3' });
        expect(Buffer.isBuffer(written[0].data)).toBe(true);
    });

    it('rejects a duration over 10 seconds before calling the API', async () => {
        const spy = mockRoutes({ replies: [] });
        await expect(run({ action: createTextToSound, propsValue: { prompt: 'rain', duration: 30 } }).result).rejects.toThrow(/between 0 and 10/);
        expect(spy).not.toHaveBeenCalled();
    });
});

describe('transcription', () => {
    const replies = (): Reply[] => [
        { match: `POST ${BASE}/transcribe`, body: { task_id: 't4' } },
        { match: `GET ${BASE}/transcribe/t4`, body: { status: 'SUCCESS', run_id: 8 } },
        { match: `GET ${BASE}/transcription-result/8`, body: [{ start: 0, end: 1, text: 'hi', speaker: 'A' }] },
    ];

    it('ai twin posts native multipart with media_url', async () => {
        const spy = mockRoutes({ replies: replies() });
        const { result } = run({ action: createTranscriptionAi, propsValue: { media_url: ' https://x/a.mp3 ', language: '1' } });
        await expect(result).resolves.toEqual({ transcript: [{ start: 0, end: 1, text: 'hi', speaker: 'A' }], run_id: '8', task_id: 't4' });
        const body = bodyOf({ spy, match: `POST ${BASE}/transcribe` });
        expect(body).toBeInstanceOf(FormData);
        if (body instanceof FormData) {
            expect(body.get('media_url')).toBe('https://x/a.mp3');
            expect(body.get('language')).toBe('1');
        }
    });

    it('human action uploads a duck-typed file', async () => {
        const spy = mockRoutes({ replies: replies() });
        await run({
            action: createTranscription,
            propsValue: { language: 1, source_type: 'file', media: { media_file: { filename: 'a.wav', extension: 'wav', data: Buffer.from('abc') } } },
        }).result;
        const body = bodyOf({ spy, match: `POST ${BASE}/transcribe` });
        expect(body instanceof FormData && body.get('media_file')).toBeTruthy();
    });

    it('human action requires the file in file mode', async () => {
        mockRoutes({ replies: [] });
        await expect(run({ action: createTranscription, propsValue: { language: 1, source_type: 'file', media: {} } }).result).rejects.toThrow(/Media File is required/);
    });
});

describe('dubbing', () => {
    it('ai twin splits comma-separated targets and returns only task_id', async () => {
        const spy = mockRoutes({ replies: [{ match: `POST ${BASE}/dub`, body: { task_id: 'd1' } }] });
        await expect(run({ action: createDubbingAi, propsValue: { video_url: 'https://v', source_language: 'en-us', target_languages: 'es-es, fr-fr,' } }).result).resolves.toEqual({ task_id: 'd1' });
        expect(bodyOf({ spy, match: `POST ${BASE}/dub` })).toEqual({ video_url: 'https://v', source_language: 'en-us', target_languages: ['es-es', 'fr-fr'] });
    });

    it('human action waits and returns the dub result', async () => {
        mockRoutes({
            replies: [
                { match: `POST ${BASE}/dub`, body: { task_id: 'd1' } },
                { match: `GET ${BASE}/dub/d1`, body: { status: 'SUCCESS', run_id: 3 } },
                { match: `GET ${BASE}/dub-result/3`, body: { video_url: 'https://out.mp4', audio_url: 'https://out.mp3', transcript: [] } },
            ],
        });
        await expect(run({ action: createDubbing, propsValue: { video_url: 'https://v', source_language: 'en-us', target_languages: ['es-es'], wait_for_completion: true } }).result).resolves.toEqual({
            task_id: 'd1', status: 'SUCCESS', run_id: '3', video_url: 'https://out.mp4', audio_url: 'https://out.mp3', transcript: [],
        });
    });

    it('human action returns PENDING without waiting', async () => {
        const spy = mockRoutes({ replies: [{ match: `POST ${BASE}/dub`, body: { task_id: 'd1' } }] });
        const out = await run({ action: createDubbing, propsValue: { video_url: 'https://v', source_language: 'en-us', target_languages: ['es-es'], wait_for_completion: false } }).result;
        expect(out).toMatchObject({ task_id: 'd1', status: 'PENDING', run_id: null });
        expect(spy).toHaveBeenCalledTimes(1);
    });
});

describe('discovery and utility actions', () => {
    it('list voices filters by name', async () => {
        mockRoutes({ replies: [{ match: `GET ${BASE}/list-voices`, body: [{ id: 1, voice_name: 'Alice', gender: 2, age: 30, language: 'en-us', transcript: 'x' }, { id: 2, voice_name: 'Bob' }] }] });
        await expect(run({ action: listVoices, propsValue: { name: 'ali' } }).result).resolves.toEqual({ voices: [{ id: 1, voice_name: 'Alice', gender: 2, age: 30, language: 'en-us' }] });
    });

    it('create folder posts to /folders/create and validates length', async () => {
        const spy = mockRoutes({ replies: [{ match: `POST ${BASE}/folders/create`, body: { status: 'ok', folder_id: 7, folder_name: 'ap-test', message: 'created' } }] });
        await expect(run({ action: createFolder, propsValue: { folder_name: ' ap-test ' } }).result).resolves.toEqual({ status: 'ok', folder_id: 7, folder_name: 'ap-test', message: 'created' });
        expect(bodyOf({ spy, match: `POST ${BASE}/folders/create` })).toEqual({ folder_name: 'ap-test' });
        await expect(run({ action: createFolder, propsValue: { folder_name: 'ab' } }).result).rejects.toThrow(/between 3 and 255/);
    });

    it('get task status and get run result hit the right paths', async () => {
        mockRoutes({
            replies: [
                { match: `GET ${BASE}/dub/abc`, body: { status: 'PENDING', run_id: null } },
                { match: `GET ${BASE}/dub-result/12`, body: { video_url: 'v' } },
            ],
        });
        await expect(run({ action: getTaskStatus, propsValue: { task_type: 'dub', task_id: ' abc ' } }).result).resolves.toEqual({ status: 'PENDING', run_id: null });
        await expect(run({ action: getRunResult, propsValue: { task_type: 'dub', run_id: '12' } }).result).resolves.toEqual({ result: { video_url: 'v' } });
    });
});
