import { afterEach, describe, expect, test, vi } from 'vitest';
import { textToSpeechAction } from '../src/actions/text-to-speech';
import { generateSpeechAction } from '../src/actions/ai/generate-speech';
import { deepgramSpeech } from '../src/common/speech';
import { runAction, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const audio = new Uint8Array([1, 2, 3, 4]);

function audioReply(contentType: string) {
  return {
    binary: audio,
    headers: {
      'content-type': contentType,
      'dg-char-count': '11',
      'dg-request-id': 'tts-1',
    },
  };
}

describe('text_to_speech', () => {
  test('keeps aura-asteria-en and mp3 as defaults, accepts any audio type and returns the file', async () => {
    const seen = stubFetch(() => audioReply('audio/mpeg'));
    const result = await runAction({
      action: textToSpeechAction,
      propsValue: { text: 'Hello world' },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3'
    );
    expect(seen[0].json).toEqual({ text: 'Hello world' });
    expect(seen[0].headers.get('accept')).toBe('*/*');
    expect(result).toEqual({
      file: 'https://files.test/audio.mp3',
      file_name: 'audio.mp3',
      content_type: 'audio/mpeg',
      size_bytes: 4,
      characters: 11,
      request_id: 'tts-1',
      model: 'aura-asteria-en',
      encoding: 'mp3',
    });
  });

  test('sends container, sample rate, bit rate and speed', async () => {
    const seen = stubFetch(() => audioReply('audio/l16;rate=8000'));
    const result = await runAction({
      action: textToSpeechAction,
      propsValue: {
        text: 'Hi',
        model: 'aura-2-thalia-en',
        encoding: 'linear16',
        container: 'none',
        sampleRate: 8000,
        speed: 1.1,
      },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/speak?model=aura-2-thalia-en&encoding=linear16&container=none&sample_rate=8000&speed=1.1'
    );
    expect(Reflect.get(Object(result), 'file_name')).toBe('audio.raw');
  });

  test('accepts exactly 2,000 characters and rejects 2,001 before calling Deepgram', async () => {
    const seen = stubFetch(() => audioReply('audio/mpeg'));
    await runAction({
      action: textToSpeechAction,
      propsValue: { text: 'a'.repeat(2000) },
    });
    await expect(
      runAction({
        action: textToSpeechAction,
        propsValue: { text: 'a'.repeat(2001) },
      })
    ).rejects.toThrow('at most 2000 characters');
    await expect(
      runAction({ action: textToSpeechAction, propsValue: { text: '   ' } })
    ).rejects.toThrow('Enter the text');
    await expect(
      runAction({
        action: textToSpeechAction,
        propsValue: { text: 'hi', speed: 3 },
      })
    ).rejects.toThrow('0.5 to 1.5');
    expect(seen).toHaveLength(1);
  });

  test.each([
    ['mp3', undefined, 'mp3'],
    ['linear16', undefined, 'wav'],
    ['mulaw', 'wav', 'wav'],
    ['alaw', 'none', 'raw'],
    ['opus', undefined, 'ogg'],
    ['flac', undefined, 'flac'],
    ['aac', undefined, 'aac'],
  ])(
    '%s with container %s is saved as .%s',
    (encoding, container, extension) => {
      expect(deepgramSpeech.fileExtension({ encoding, container })).toBe(
        extension
      );
    }
  );
});

describe('deepgram_generate_speech', () => {
  test('defaults to aura-2-thalia-en', async () => {
    const seen = stubFetch(() => audioReply('audio/mpeg'));
    await runAction({
      action: generateSpeechAction,
      propsValue: { text: 'Hello' },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/speak?model=aura-2-thalia-en&encoding=mp3'
    );
  });

  test('normalizes and validates the voice ID and format', async () => {
    const seen = stubFetch(() => audioReply('audio/ogg;codecs=opus'));
    await runAction({
      action: generateSpeechAction,
      propsValue: {
        text: 'Hola',
        voice: ' AURA-2-celeste-es ',
        encoding: 'opus',
      },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/speak?model=aura-2-celeste-es&encoding=opus'
    );
    await expect(
      runAction({
        action: generateSpeechAction,
        propsValue: { text: 'x', voice: 'thalia' },
      })
    ).rejects.toThrow('is not a Deepgram voice ID');
    await expect(
      runAction({
        action: generateSpeechAction,
        propsValue: { text: 'x', encoding: 'wav' },
      })
    ).rejects.toThrow('Unknown audio format "wav"');
    expect(seen).toHaveLength(1);
  });
});

describe('speech errors', () => {
  test('decodes the binary error body so code and request id survive', async () => {
    stubFetch(() => ({
      status: 400,
      text: JSON.stringify({
        err_code: 'INVALID_QUERY_PARAMETER',
        err_msg: 'Unsupported encoding.',
        request_id: 'req-42',
      }),
    }));
    const error = await runAction({
      action: textToSpeechAction,
      propsValue: { text: 'Hello world' },
    }).catch((e: unknown) => e);
    expect(error).toMatchObject({
      name: 'DeepgramApiError',
      status: 400,
      code: 'INVALID_QUERY_PARAMETER',
      requestId: 'req-42',
    });
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toContain('Unsupported encoding.');
    expect(message).toContain('Deepgram request ID: req-42.');
  });
});
