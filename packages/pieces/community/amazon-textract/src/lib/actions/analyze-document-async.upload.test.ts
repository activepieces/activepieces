import {
  AbortMultipartUploadCommand,
  CreateMultipartUploadCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { TextractClient } from '@aws-sdk/client-textract';
import { ApFile, AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeDocumentAsync } from './analyze-document-async';

const PART_SIZE = 5 * 1024 * 1024;

describe('Analyze Document from S3 (Multi-Page) upload, with the real lib-storage', () => {
  const events: string[] = [];

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    events.length = 0;
    vi.spyOn(TextractClient.prototype, 'send').mockRejectedValue(new Error('Textract must not be called'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('removes the parts of an upload stopped at 6 minutes only after the parts still being sent have finished', async () => {
    vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: unknown) => {
      if (command instanceof CreateMultipartUploadCommand) {
        events.push('create');
        return { UploadId: 'upload-1' };
      }
      if (command instanceof UploadPartCommand) {
        const part = command.input.PartNumber ?? 0;
        events.push(`send ${part}`);
        if (part === 1) {
          vi.setSystemTime(Date.now() + 7 * 60 * 1000);
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
        events.push(`sent ${part}`);
        return { ETag: `"etag-${part}"` };
      }
      if (command instanceof AbortMultipartUploadCommand) {
        events.push('abort');
        return {};
      }
      events.push(command instanceof Object ? command.constructor.name : 'unknown');
      return {};
    });

    await expect(
      runAction(new ApFile('big.pdf', Buffer.alloc(PART_SIZE * 10, 1), 'pdf'))
    ).rejects.toThrow(/^Uploading the file took over 6 minutes, so this step has too little time left/);

    const sending = events.filter((event) => event.startsWith('send ')).map((event) => event.slice(5));
    const sent = events.filter((event) => event.startsWith('sent ')).map((event) => event.slice(5));
    expect(events.at(-1)).toBe('abort');
    expect(events.filter((event) => event === 'abort')).toHaveLength(1);
    expect([...sent].sort()).toEqual([...sending].sort());
    expect(sending.length).toBeLessThan(10);
    expect(events).not.toContain('CompleteMultipartUploadCommand');
    expect(TextractClient.prototype.send).not.toHaveBeenCalled();
  });

  it('stops the upload at 8 minutes when the parts still being sent have not finished, and removes them', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.spyOn(S3Client.prototype, 'send').mockImplementation(async (command: unknown) => {
      if (command instanceof CreateMultipartUploadCommand) {
        events.push('create');
        return { UploadId: 'upload-1' };
      }
      if (command instanceof UploadPartCommand) {
        const part = command.input.PartNumber ?? 0;
        events.push(`send ${part}`);
        if (part !== 4) {
          return new Promise(() => undefined);
        }
        vi.setSystemTime(Date.now() + 7 * 60 * 1000);
        return { ETag: '"etag-4"' };
      }
      if (command instanceof AbortMultipartUploadCommand) {
        events.push('abort');
        return {};
      }
      events.push(command instanceof Object ? command.constructor.name : 'unknown');
      return {};
    });

    const outcome = runAction(new ApFile('big.pdf', Buffer.alloc(PART_SIZE * 10, 1), 'pdf')).catch((e: unknown) => e);
    while (!events.includes('send 4')) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    await vi.advanceTimersByTimeAsync(8 * 60 * 1000);
    const error = await outcome;

    expect(error).toBeInstanceOf(Error);
    expect(error instanceof Error ? error.message : '').toMatch(
      /^Uploading the file took over 6 minutes, so this step has too little time left/
    );
    expect(events).toEqual(expect.arrayContaining(['send 1', 'send 2', 'send 3', 'send 4']));
    expect(events.filter((event) => event.startsWith('send ')).length).toBeLessThan(10);
    expect(events.at(-1)).toBe('abort');
    expect(events.filter((event) => event === 'abort')).toHaveLength(1);
    expect(TextractClient.prototype.send).not.toHaveBeenCalled();
  });
});

function runAction(file: ApFile): Promise<unknown> {
  return analyzeDocumentAsync.run({
    ...createMockActionContext<typeof analyzeDocumentAsync.props>({
      propsValue: {
        s3Bucket: 'docs-bucket',
        source: 'file',
        file,
        s3Key: undefined,
        featureTypes: ['TABLES', 'FORMS'],
        queries: [],
        clientRequestToken: undefined,
      },
    }),
    auth: {
      type: AppConnectionType.CUSTOM_AUTH,
      props: { accessKeyId: 'AKIATEST', secretAccessKey: 'test-secret', region: 'us-east-1' },
    },
  });
}
