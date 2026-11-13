import { afterEach, describe, expect, test, vi } from 'vitest';
import { transcribeAudioAction } from '../src/actions/transcribe-audio';
import { createSummaryAction } from '../src/actions/create-summary';
import { createTranscriptionCallbackAction } from '../src/actions/create-transcription';
import { deepgramTranscript } from '../src/common/transcript';
import { runAction, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const AUDIO_URL =
  'https://static.deepgram.com/examples/nasa-spacewalk-interview.wav';

function listenReply({
  channels = 1,
  summary,
}: { channels?: number; summary?: unknown } = {}) {
  return {
    metadata: {
      request_id: 'req-1',
      duration: 25.9,
      channels,
      models: ['m-1'],
      model_info: {
        'm-1': {
          name: 'general-nova-3',
          version: '2025-07-31.0',
          arch: 'nova-3',
        },
      },
      warnings: [
        { parameter: 'keyterm', type: 'unsupported', message: 'ignored' },
      ],
    },
    results: {
      channels: Array.from({ length: channels }, (_, index) => ({
        detected_language: 'en',
        language_confidence: 0.99,
        alternatives: [
          {
            transcript: `hello from channel ${index}`,
            confidence: 0.9,
            paragraphs: {
              transcript: `\nSpeaker 0: hello from channel ${index}`,
            },
            entities: [{ label: 'NAME', value: ' Jane', confidence: 0.98 }],
            words: [
              {
                word: 'hello',
                punctuated_word: 'Hello',
                start: 0,
                end: 0.5,
                confidence: 0.9,
                speaker: 0,
              },
              {
                word: 'there',
                punctuated_word: 'there.',
                start: 0.5,
                end: 1,
                confidence: 0.9,
                speaker: 1,
              },
            ],
          },
        ],
      })),
      utterances: [
        {
          speaker: 0,
          channel: 0,
          start: 0,
          end: 0.5,
          confidence: 0.9,
          transcript: 'Hello',
          id: 'u1',
        },
      ],
      ...(summary === undefined ? {} : { summary }),
      topics: {
        segments: [
          {
            text: 'Hello there.',
            start_word: 0,
            end_word: 1,
            topics: [{ topic: 'Greeting', confidence_score: 0.8 }],
          },
        ],
      },
      intents: {
        segments: [
          {
            text: 'Hello there.',
            intents: [{ intent: 'Say hello', confidence_score: 0.7 }],
          },
        ],
      },
      sentiments: {
        segments: [
          { text: 'Hello there.', sentiment: 'positive', sentiment_score: 0.5 },
        ],
        average: { sentiment: 'positive', sentiment_score: 0.4 },
      },
    },
  };
}

describe('transcribe_audio', () => {
  test('sends a JSON url body with nova-3 and smart format by default', async () => {
    const seen = stubFetch(() => ({ body: listenReply() }));
    await runAction({
      action: transcribeAudioAction,
      propsValue: { audioUrl: AUDIO_URL },
    });
    expect(seen[0].method).toBe('POST');
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true'
    );
    expect(seen[0].json).toEqual({ url: AUDIO_URL });
    expect(seen[0].headers.get('content-type')).toBe('application/json');
  });

  test('builds every feature parameter, repeating keyterm, redact and tag', async () => {
    const seen = stubFetch(() => ({ body: listenReply() }));
    await runAction({
      action: transcribeAudioAction,
      propsValue: {
        audioUrl: AUDIO_URL,
        model: 'nova-3-general',
        language: 'en-US',
        smartFormat: false,
        diarize: true,
        paragraphs: true,
        utterances: true,
        multichannel: true,
        keyterms: ['Activepieces', ' Deepgram '],
        redact: ['pci', 'pii'],
        detectEntities: true,
        summarize: true,
        topics: true,
        intents: true,
        sentiment: true,
        tags: ['flow-1'],
      },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/listen?model=nova-3-general&language=en-US&diarize_model=latest&paragraphs=true&utterances=true&multichannel=true&detect_entities=true&summarize=v2&topics=true&intents=true&sentiment=true&keyterm=Activepieces&keyterm=Deepgram&redact=pci&redact=pii&tag=flow-1'
    );
  });

  test('streams an uploaded file with its MIME type, or octet-stream when unknown', async () => {
    const seen = stubFetch(() => ({ body: listenReply() }));
    const data = Buffer.from('RIFF....WAVEfmt fake audio');
    await runAction({
      action: transcribeAudioAction,
      propsValue: {
        audioFile: { filename: 'call.wav', extension: 'wav', data },
      },
    });
    await runAction({
      action: transcribeAudioAction,
      propsValue: { audioFile: { filename: 'blob', data } },
    });
    expect(seen[0].streamed).toBe(true);
    expect(seen[0].bytes?.equals(data)).toBe(true);
    expect(seen[0].headers.get('content-type')).toBe('audio/wave');
    expect(seen[1].headers.get('content-type')).toBe(
      'application/octet-stream'
    );
  });

  test('detect language drops the language parameter', async () => {
    const seen = stubFetch(() => ({ body: listenReply() }));
    await runAction({
      action: transcribeAudioAction,
      propsValue: {
        audioUrl: AUDIO_URL,
        language: 'de',
        detectLanguage: true,
        summarize: true,
      },
    });
    expect(seen[0].url).toContain('detect_language=true');
    expect(seen[0].url).not.toContain('language=de');
  });

  test.each([
    [{}, 'Provide an audio URL or an audio file'],
    [
      {
        audioUrl: AUDIO_URL,
        audioFile: { filename: 'a.wav', data: Buffer.from('x') },
      },
      'not both',
    ],
    [{ audioUrl: 'ftp://x.io/a.wav' }, 'must start with https:// or http://'],
    [
      { audioUrl: AUDIO_URL, language: 'es', summarize: true },
      'only work on English audio',
    ],
    [
      { audioUrl: AUDIO_URL, model: 'nova-2-general', keyterms: ['x'] },
      'only work with nova-3',
    ],
    [{ audioUrl: AUDIO_URL, redact: ['ssn'] }, 'Unknown redaction type: ssn'],
    [{ audioFile: { filename: 'a.wav', data: Buffer.alloc(0) } }, 'empty'],
  ])('rejects %j before any request', async (props, message) => {
    const seen = stubFetch(() => ({ body: listenReply() }));
    await expect(
      runAction({ action: transcribeAudioAction, propsValue: props })
    ).rejects.toThrow(message);
    expect(seen).toHaveLength(0);
  });

  test('flattens transcript, speakers, channels, intelligence and warnings', async () => {
    stubFetch(() => ({
      body: listenReply({
        channels: 2,
        summary: { result: 'success', short: 'A greeting.' },
      }),
    }));
    const result = await runAction({
      action: transcribeAudioAction,
      propsValue: { audioUrl: AUDIO_URL, includeWords: true },
    });
    expect(result).toEqual(
      expect.objectContaining({
        request_id: 'req-1',
        transcript: 'hello from channel 0\n\nhello from channel 1',
        duration_seconds: 25.9,
        detected_language: 'en',
        model_name: 'general-nova-3',
        channel_count: 2,
        paragraphs_text:
          'Speaker 0: hello from channel 0\n\nSpeaker 0: hello from channel 1',
        speaker_count: 2,
        summary: 'A greeting.',
        topics: [{ topic: 'Greeting', confidence: 0.8, text: 'Hello there.' }],
        intents: [
          { intent: 'Say hello', confidence: 0.7, text: 'Hello there.' },
        ],
        sentiment: 'positive',
        sentiment_score: 0.4,
        warnings: ['keyterm: ignored'],
      })
    );
    const flat = Reflect.get(Object(result), 'speaker_transcript');
    expect(flat).toBe(
      'Speaker 0: Hello\nSpeaker 1: there.\nSpeaker 0: Hello\nSpeaker 1: there.'
    );
    expect(Reflect.get(Object(result), 'channels')).toHaveLength(2);
    expect(Reflect.get(Object(result), 'entities')).toEqual([
      { label: 'NAME', value: 'Jane', confidence: 0.98, channel: 0 },
      { label: 'NAME', value: 'Jane', confidence: 0.98, channel: 1 },
    ]);
    expect(Reflect.get(Object(result), 'words')).toHaveLength(4);
  });

  test('leaves words out unless asked and turns a failed summary into a warning', () => {
    const flat = deepgramTranscript.flattenListen({
      body: listenReply({
        summary: {
          result: 'failure',
          short:
            'The summarization feature is currently only available in English.',
        },
      }),
      includeWords: false,
    });
    expect(flat.words).toEqual([]);
    expect(flat.summary).toBeNull();
    expect(flat.warnings).toContain(
      'Summary not available: The summarization feature is currently only available in English.'
    );
  });
});

describe('create_summary', () => {
  const audioFile = {
    filename: 'a.mp3',
    extension: 'mp3',
    data: Buffer.from('ID3 fake'),
  };

  test('keeps the nova default and returns the summary object on success', async () => {
    const seen = stubFetch(() => ({
      body: listenReply({ summary: { result: 'success', short: 'Short.' } }),
    }));
    const result = await runAction({
      action: createSummaryAction,
      propsValue: { audioFile, fallbackToTranscript: true },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/listen?model=nova&summarize=v2&language=en'
    );
    expect(seen[0].headers.get('content-type')).toBe('audio/mpeg');
    expect(seen[0].streamed).toBe(true);
    expect(result).toEqual({ result: 'success', short: 'Short.' });
  });

  test('a failed summary falls back to the transcript', async () => {
    stubFetch(() => ({
      body: listenReply({ summary: { result: 'failure', short: 'nope' } }),
    }));
    await expect(
      runAction({
        action: createSummaryAction,
        propsValue: { audioFile, fallbackToTranscript: true },
      })
    ).resolves.toBe('hello from channel 0');
  });

  test('a failed summary without fallback throws with the reason', async () => {
    stubFetch(() => ({
      body: listenReply({ summary: { result: 'failure', short: 'nope' } }),
    }));
    await expect(
      runAction({
        action: createSummaryAction,
        propsValue: { audioFile, fallbackToTranscript: false },
      })
    ).rejects.toThrow('Deepgram could not summarize this audio (nope)');
  });

  test('refuses a non-English language before uploading', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({
        action: createSummaryAction,
        propsValue: { audioFile, language: 'fr' },
      })
    ).rejects.toThrow('only available for English');
    expect(seen).toHaveLength(0);
  });
});

describe('create_transcription_callback', () => {
  test('sends the callback and masks its credentials in the output', async () => {
    const seen = stubFetch(() => ({ body: { request_id: 'cb-1' } }));
    const result = await runAction({
      action: createTranscriptionCallbackAction,
      propsValue: {
        audioUrl: AUDIO_URL,
        callbackUrl: 'https://u:secret@hooks.example.com/cb',
        callbackMethod: 'PUT',
      },
    });
    expect(seen[0].url).toBe(
      'https://api.deepgram.com/v1/listen?model=nova&callback=https%3A%2F%2Fu%3Asecret%40hooks.example.com%2Fcb&callback_method=put&language=en'
    );
    expect(result).toEqual({
      requestId: 'cb-1',
      callbackUrl: 'https://***@hooks.example.com/cb',
      status: 'submitted',
    });
    expect(JSON.stringify(result)).not.toContain('secret');
  });

  test.each([
    ['https://hooks.example.com:9000/cb', 'ports 80, 443, 8080 or 8443'],
    ['ftp://hooks.example.com/cb', 'must start with https:// or http://'],
    ['not a url', 'full URL'],
  ])('rejects callback %s', async (callbackUrl, message) => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({
        action: createTranscriptionCallbackAction,
        propsValue: { audioUrl: AUDIO_URL, callbackUrl },
      })
    ).rejects.toThrow(message);
    expect(seen).toHaveLength(0);
  });

  test('accepts port 8443', async () => {
    stubFetch(() => ({ body: { request_id: 'cb-2' } }));
    await expect(
      runAction({
        action: createTranscriptionCallbackAction,
        propsValue: {
          audioUrl: AUDIO_URL,
          callbackUrl: 'https://hooks.example.com:8443/cb',
        },
      })
    ).resolves.toEqual(expect.objectContaining({ requestId: 'cb-2' }));
  });
});
