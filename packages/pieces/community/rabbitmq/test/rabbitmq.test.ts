import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => {
  const value: FakeState = {
    uris: [],
    queue: [],
    acked: 0,
    nackAllRequeue: [],
    checkQueueError: undefined,
  };
  return value;
});

vi.mock('amqplib', async () => {
  const { EventEmitter: Emitter } = await import('node:events');
  class FakeChannel extends Emitter {
    closeCalls = 0;
    async checkQueue(queue: string) {
      if (state.checkQueueError) {
        const message = state.checkQueueError;
        setImmediate(() => {
          this.emit('error', new Error(message));
          this.emit('close');
        });
        await new Promise((r) => setTimeout(r, 5));
        throw new Error('Channel closed');
      }
      return { queue, messageCount: state.queue.length, consumerCount: 0 };
    }
    async get() {
      return state.queue.shift() ?? false;
    }
    ack() {
      state.acked++;
    }
    nackAll(requeue: boolean) {
      state.nackAllRequeue.push(requeue);
    }
    async close() {
      this.closeCalls++;
      if (state.checkQueueError) {
        throw new Error('Channel already closed');
      }
    }
  }
  class FakeConnection extends Emitter {
    async createChannel() {
      return new FakeChannel();
    }
    async createConfirmChannel() {
      return new FakeChannel();
    }
    async close() {
      return;
    }
  }
  const connect = async (uri: string) => {
    state.uris.push(uri);
    return new FakeConnection();
  };
  return { default: { connect }, connect };
});

import { rabbitmqCommon } from '../src/lib/common';
import { messageReceived } from '../src/lib/triggers/message-received';

const auth: TestAuth = {
  host: 'broker.local',
  username: 'ap user',
  password: 'p@ss:w/rd#1',
  port: 5672,
  vhost: '/',
  useTls: false,
  managementUrl: undefined,
};

function message(text: string) {
  return {
    content: Buffer.from(text),
    properties: { headers: {} },
    fields: { deliveryTag: 1, redelivered: false, exchange: '', routingKey: 'q' },
  };
}

function triggerContext() {
  return { auth: { props: auth }, propsValue: { queue: 'q', maxMessagesPerPoll: 10 } };
}

beforeEach(() => {
  state.uris = [];
  state.queue = [];
  state.acked = 0;
  state.nackAllRequeue = [];
  state.checkQueueError = undefined;
  vi.unstubAllGlobals();
});

describe('connection URI', () => {
  it('encodes username, password and vhost', async () => {
    await rabbitmqCommon.withChannel({ auth, fn: async () => null });
    expect(state.uris[0]).toBe('amqp://ap%20user:p%40ss%3Aw%2Frd%231@broker.local:5672/%2F');
  });

  it('uses amqps and no vhost path when TLS on and vhost empty', async () => {
    await rabbitmqCommon.withChannel({ auth: { ...auth, useTls: true, vhost: '', port: 5671 }, fn: async () => null });
    expect(state.uris[0]).toBe('amqps://ap%20user:p%40ss%3Aw%2Frd%231@broker.local:5671');
  });
});

describe('channel error handling', () => {
  it('turns a 404 channel error event into a clean message', async () => {
    state.checkQueueError = "Channel closed by server: 404 (NOT-FOUND) with message \"NOT_FOUND - no queue 'no-such-queue' in vhost '/'\"";
    await expect(
      rabbitmqCommon.withChannel({ auth, fn: (channel) => channel.checkQueue('no-such-queue') }),
    ).rejects.toThrow('Queue "no-such-queue" does not exist in vhost "/".');
  });

  it('maps a missing exchange message', () => {
    const error = rabbitmqCommon.toPieceError(new Error("NOT_FOUND - no exchange 'ex' in vhost 'prod'"));
    expect(error.message).toBe('Exchange "ex" does not exist in vhost "prod".');
  });
});

describe('message received trigger', () => {
  it('test() requeues messages instead of acking them', async () => {
    state.queue = [message('{"a":1}'), message('plain text')];
    const items = await messageReceived.test(fakeContext());
    expect(items).toHaveLength(2);
    expect(state.acked).toBe(0);
    expect(state.nackAllRequeue).toEqual([true]);
  });

  it('run() acks messages and keeps non-JSON bodies as text', async () => {
    state.queue = [message('{"a":1}'), message('plain text')];
    const items = await messageReceived.run(fakeContext());
    expect(state.acked).toBe(2);
    expect(state.nackAllRequeue).toEqual([]);
    expect(items).toMatchObject([
      { content: { a: 1 }, rawContent: '{"a":1}' },
      { content: 'plain text', rawContent: 'plain text' },
    ]);
  });
});

describe('managementRequest', () => {
  it('fails clearly when the management URL is missing', async () => {
    await expect(rabbitmqCommon.managementRequest({ auth, path: '/queues/%2F' })).rejects.toThrow(
      'Set "Management API URL" in the connection',
    );
  });

  it('throws status and responseBody without credentials on non-2xx', async () => {
    const fetchMock = vi.fn(async () => new Response('{"error":"not_authorised"}', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const error = await rabbitmqCommon
      .managementRequest({ auth: { ...auth, managementUrl: 'http://localhost:15672/' }, path: '/queues/%2F?columns=name' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ status: 401, responseBody: '{"error":"not_authorised"}' });
    const serialized = JSON.stringify({ ...Object(error), message: String(error) });
    expect(serialized).not.toContain(auth.password);
    expect(serialized).not.toContain(Buffer.from(`${auth.username}:${auth.password}`).toString('base64'));
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:15672/api/queues/%2F?columns=name', expect.anything());
  });
});

function fakeContext(): Parameters<typeof messageReceived.run>[0] {
  const ctx = triggerContext();
  return Object.create(null, {
    auth: { value: ctx.auth, enumerable: true },
    propsValue: { value: ctx.propsValue, enumerable: true },
  });
}

type FakeMessage = { content: Buffer; properties: Record<string, unknown>; fields: Record<string, unknown> };

type FakeState = {
  uris: string[];
  queue: FakeMessage[];
  acked: number;
  nackAllRequeue: boolean[];
  checkQueueError: string | undefined;
};

type TestAuth = {
  host: string;
  username: string;
  password: string;
  port: number;
  vhost: string;
  useTls: boolean;
  managementUrl: string | undefined;
};
