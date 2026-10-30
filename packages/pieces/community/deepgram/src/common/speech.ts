import { HttpMethod } from '@activepieces/pieces-common';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from './client';
import { MAX_TTS_CHARACTERS } from './constants';

const WAV_ENCODINGS = ['linear16', 'mulaw', 'alaw'];

const EXTENSIONS: Record<string, string> = {
  mp3: 'mp3',
  opus: 'ogg',
  flac: 'flac',
  aac: 'aac',
};

function checkText(text: unknown): string {
  const value = typeof text === 'string' ? text : '';
  if (value.trim().length === 0) {
    throw new Error('Enter the text to convert to speech.');
  }
  if (value.length > MAX_TTS_CHARACTERS) {
    throw new Error(
      `Deepgram converts at most ${MAX_TTS_CHARACTERS} characters per request and this text has ${value.length}. Split the text into smaller parts and convert each one.`
    );
  }
  return value;
}

function checkSpeed(speed: unknown): number | undefined {
  if (speed === undefined || speed === null || speed === '') {
    return undefined;
  }
  const value = Number(speed);
  if (!Number.isFinite(value) || value < 0.5 || value > 1.5) {
    throw new Error(
      'Speed must be a number from 0.5 to 1.5 (1 is normal speed).'
    );
  }
  return value;
}

function checkPositiveInteger({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a whole number greater than 0.`);
  }
  return parsed;
}

function fileExtension({
  encoding,
  container,
}: {
  encoding: string;
  container: string | undefined;
}): string {
  if (WAV_ENCODINGS.includes(encoding)) {
    return container === 'none' ? 'raw' : 'wav';
  }
  return EXTENSIONS[encoding] ?? 'mp3';
}

function headerValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function synthesize({
  apiKey,
  text,
  model,
  encoding,
  container,
  sampleRate,
  bitRate,
  speed,
  writeFile,
}: {
  apiKey: string;
  text: unknown;
  model: string;
  encoding: string | undefined | null;
  container?: string | null;
  sampleRate?: unknown;
  bitRate?: unknown;
  speed?: unknown;
  writeFile: (params: { fileName: string; data: Buffer }) => Promise<string>;
}): Promise<SpeechOutput> {
  const content = checkText(text);
  const chosenEncoding = encoding && encoding.length > 0 ? encoding : 'mp3';
  const chosenContainer =
    container && WAV_ENCODINGS.includes(chosenEncoding) ? container : undefined;
  const response = await deepgramClient.request<Buffer>({
    apiKey,
    method: HttpMethod.POST,
    path: '/speak',
    query: {
      model,
      encoding: chosenEncoding,
      container: chosenContainer,
      sample_rate: checkPositiveInteger({
        value: sampleRate,
        label: 'Sample rate',
      }),
      bit_rate: checkPositiveInteger({ value: bitRate, label: 'Bit rate' }),
      speed: checkSpeed(speed),
    },
    body: { text: content },
    headers: { Accept: '*/*' },
    responseType: 'arraybuffer',
    timeoutMs: DEEPGRAM_TIMEOUTS.speak,
    operation: 'convert the text to speech',
  });
  const data = Buffer.from(response.body);
  const fileName = `audio.${fileExtension({
    encoding: chosenEncoding,
    container: chosenContainer,
  })}`;
  const file = await writeFile({ fileName, data });
  const characters = Number(headerValue(response.headers['dg-char-count']));
  return {
    file,
    file_name: fileName,
    content_type: headerValue(response.headers['content-type']),
    size_bytes: data.length,
    characters:
      Number.isFinite(characters) && characters > 0
        ? characters
        : content.length,
    request_id: headerValue(response.headers['dg-request-id']),
    model,
    encoding: chosenEncoding,
  };
}

export const deepgramSpeech = {
  synthesize,
  checkText,
  checkSpeed,
  fileExtension,
};

export type SpeechOutput = {
  file: string;
  file_name: string;
  content_type: string | null;
  size_bytes: number;
  characters: number;
  request_id: string | null;
  model: string;
  encoding: string;
};
