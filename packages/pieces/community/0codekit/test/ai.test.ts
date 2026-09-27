import { HttpError } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { entityDetectionAction } from '../src/lib/actions/ai/entity-detection';
import { languageDetectionAction } from '../src/lib/actions/ai/language-detection';
import { moodDetectionAction } from '../src/lib/actions/ai/mood-detection';
import { pictureObjectRecognitionAction } from '../src/lib/actions/ai/picture-object-recognition';
import { pictureTextRecognitionAction } from '../src/lib/actions/ai/picture-text-recognition';
import { translateTextAction } from '../src/lib/actions/ai/translate-text';
import { runAction } from './helpers';

const sendRequest = vi.fn();

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
});

describe('actions metadata', () => {
    it.each([
        [entityDetectionAction, 'Entity Detection'],
        [languageDetectionAction, 'Language Detection'],
        [moodDetectionAction, 'Mood Detection'],
        [pictureObjectRecognitionAction, 'Picture Object Recognition'],
        [pictureTextRecognitionAction, 'Picture Text Recognition'],
        [translateTextAction, 'Translate Text'],
    ])('%# has the Workato display name and AI metadata', (action, displayName) => {
        expect(action.displayName).toBe(displayName);
        expect(action.audience).toBe('both');
        expect(action.classification).toBe('READ');
        expect(action.aiMetadata?.idempotent).toBe(true);
        expect(action.aiMetadata?.description?.length).toBeGreaterThan(20);
    });
});

describe('Entity Detection', () => {
    it('posts the text and flattens detections', async () => {
        respond({
            detections: [
                { text: 'Berlin', category: 'Location', subCategory: 'City', offset: 10, length: 6, confidenceScore: 0.98 },
                { text: 'Anna', category: 'Person', offset: 0, length: 4, confidenceScore: 0.9 },
            ],
        });
        const result = await runAction({ action: entityDetectionAction, propsValue: { text: ' Anna lives in Berlin ' } });
        expect(sent().url).toBe('https://v2.1saas.co/ai/entitydetection');
        expect(sent().method).toBe('POST');
        expect(sent().headers).toEqual({ auth: 'zck_test' });
        expect(sent().body).toEqual({ text: 'Anna lives in Berlin' });
        expect(result).toEqual({
            entity_count: 2,
            entities: [
                { text: 'Berlin', category: 'Location', sub_category: 'City', offset: 10, length: 6, confidence_score: 0.98 },
                { text: 'Anna', category: 'Person', sub_category: null, offset: 0, length: 4, confidence_score: 0.9 },
            ],
        });
    });

    it('returns an empty list when nothing is found', async () => {
        respond({ detections: [] });
        expect(await runAction({ action: entityDetectionAction, propsValue: { text: 'hello' } })).toEqual({ entity_count: 0, entities: [] });
    });

    it('rejects empty text without calling the API', async () => {
        await expect(runAction({ action: entityDetectionAction, propsValue: { text: '   ' } })).rejects.toThrow('Text cannot be empty.');
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('Language Detection', () => {
    it('maps the detected language', async () => {
        respond({ name: 'German', iso6391Name: 'de', confidenceScore: 1 });
        const result = await runAction({ action: languageDetectionAction, propsValue: { text: 'Guten Tag' } });
        expect(sent().url).toBe('https://v2.1saas.co/ai/languagedetection');
        expect(sent().body).toEqual({ text: 'Guten Tag' });
        expect(result).toEqual({ language_name: 'German', language_code: 'de', confidence_score: 1 });
    });

    it('surfaces 0CodeKit error messages', async () => {
        sendRequest.mockRejectedValueOnce(
            new HttpError({}, { status: 400, responseBody: { status: 400, errorMessage: 'Text too long', code: 'bad_request' } }),
        );
        await expect(runAction({ action: languageDetectionAction, propsValue: { text: 'x' } })).rejects.toThrow(
            '0CodeKit returned 400: Text too long (bad_request)',
        );
    });
});

describe('Mood Detection', () => {
    it('flattens the scores and sentences', async () => {
        respond({
            moodOverall: 'mixed',
            moodScore: { positive: 0.5, neutral: 0.1, negative: 0.4 },
            moodPerSentence: [
                { mood: 'positive', text: 'I love it.' },
                { mood: 'negative', text: 'Shipping was slow.' },
            ],
        });
        const result = await runAction({ action: moodDetectionAction, propsValue: { text: 'I love it. Shipping was slow.' } });
        expect(sent().url).toBe('https://v2.1saas.co/ai/mooddetection');
        expect(sent().body).toEqual({ text: 'I love it. Shipping was slow.' });
        expect(result).toEqual({
            mood: 'mixed',
            positive_score: 0.5,
            neutral_score: 0.1,
            negative_score: 0.4,
            sentences: [
                { text: 'I love it.', mood: 'positive' },
                { text: 'Shipping was slow.', mood: 'negative' },
            ],
        });
    });

    it('tolerates a sparse response', async () => {
        respond({});
        expect(await runAction({ action: moodDetectionAction, propsValue: { text: 'ok' } })).toEqual({
            mood: null,
            positive_score: null,
            neutral_score: null,
            negative_score: null,
            sentences: [],
        });
    });
});

describe('Picture Object Recognition', () => {
    it('sends the image URL and returns labels', async () => {
        respond({ recognizedLabels: ['dog', 'beach'] });
        const result = await runAction({ action: pictureObjectRecognitionAction, propsValue: { imageUrl: ' https://example.com/dog.jpg ' } });
        expect(sent().url).toBe('https://v2.1saas.co/ai/pictureobjectrecognition');
        expect(sent().body).toEqual({ imageUrl: 'https://example.com/dog.jpg' });
        expect(result).toEqual({ label_count: 2, labels: ['dog', 'beach'] });
    });

    it('requires an image URL', async () => {
        await expect(runAction({ action: pictureObjectRecognitionAction, propsValue: { imageUrl: '' } })).rejects.toThrow('Image URL cannot be empty.');
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('Picture Text Recognition', () => {
    it('returns the lines and the joined text', async () => {
        respond({ recognizedTexts: ['INVOICE', 'Total: 42.00'] });
        const result = await runAction({ action: pictureTextRecognitionAction, propsValue: { imageUrl: 'https://example.com/scan.png' } });
        expect(sent().url).toBe('https://v2.1saas.co/ai/picturetextrecognition');
        expect(sent().body).toEqual({ imageUrl: 'https://example.com/scan.png' });
        expect(result).toEqual({ text: 'INVOICE\nTotal: 42.00', line_count: 2, lines: ['INVOICE', 'Total: 42.00'] });
    });

    it('handles a missing list', async () => {
        respond({});
        expect(await runAction({ action: pictureTextRecognitionAction, propsValue: { imageUrl: 'https://example.com/blank.png' } })).toEqual({
            text: '',
            line_count: 0,
            lines: [],
        });
    });
});

describe('Translate Text', () => {
    it('sends text and target language', async () => {
        respond({ translation: 'Hola, mundo!' });
        const result = await runAction({ action: translateTextAction, propsValue: { text: 'Hello, world!', resultLang: 'es' } });
        expect(sent().url).toBe('https://v2.1saas.co/ai/translate');
        expect(sent().body).toEqual({ text: 'Hello, world!', resultLang: 'es' });
        expect(result).toEqual({ translation: 'Hola, mundo!', target_language: 'es' });
    });

    it('requires a target language', async () => {
        await expect(runAction({ action: translateTextAction, propsValue: { text: 'Hello' } })).rejects.toThrow('Target Language cannot be empty.');
        expect(sendRequest).not.toHaveBeenCalled();
    });
});
