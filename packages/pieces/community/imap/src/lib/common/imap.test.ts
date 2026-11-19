import { describe, expect, it, mock } from 'bun:test';
import { EventEmitter } from 'events';
import { AppConnectionType } from '@activepieces/pieces-framework';
import {
  ImapAuthenticationError,
  ImapConnectionRefusedError,
  ImapConnectionTimeoutError,
  ImapHostNotFoundError,
  ImapSslPacketLengthTooLongError,
  ImapCertificateError,
  ImapMailboxNotFoundError,
} from './errors';

const mockConnect = mock(() => Promise.resolve());
const mockLogout = mock(() => Promise.resolve());
const mockClose = mock(() => undefined);

class MockImapFlow extends EventEmitter {
  public usable = true;
  public connect = mockConnect;
  public logout = mockLogout;
  public close = mockClose;

  constructor(public options: unknown) {
    super();
  }
}

mock.module('imapflow', () => ({
  ImapFlow: MockImapFlow,
}));

mock.module('mailparser', () => ({
  simpleParser: mock(() => Promise.resolve({})),
}));

const { buildImapClient, performImapOperation } = await import('./imap');

const dummyAuth = {
  type: AppConnectionType.CUSTOM_AUTH as const,
  props: {
    host: 'imap.example.com',
    port: 993,
    tls: true,
    username: 'user@example.com',
    password: 'password123',
    validateCertificates: true,
  },
};

describe('IMAP Common', () => {
  describe('buildImapClient', () => {
    it('creates an ImapFlow instance with error listener registered', () => {
      const client = buildImapClient(dummyAuth);
      expect(client.listenerCount('error')).toBeGreaterThan(0);

      expect(() => {
        client.emit('error', new Error('Socket timeout'));
      }).not.toThrow();
    });
  });

  describe('performImapOperation', () => {
    it('gracefully logs out when operation succeeds', async () => {
      mockConnect.mockImplementation(() => Promise.resolve());
      mockLogout.mockImplementation(() => Promise.resolve());
      mockClose.mockClear();
      mockLogout.mockClear();

      const result = await performImapOperation(dummyAuth, async () => {
        return 'success';
      });

      expect(result).toBe('success');
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockClose).not.toHaveBeenCalled();
    });

    it('closes client and does not logout when connect fails (Issue #17567)', async () => {
      mockConnect.mockImplementation(function (this: MockImapFlow) {
        this.usable = false;
        const err = new Error('Authentication failed');
        Object.assign(err, { responseText: 'AUTHENTICATIONFAILED Invalid credentials' });
        return Promise.reject(err);
      });
      mockLogout.mockClear();
      mockClose.mockClear();

      await expect(
        performImapOperation(dummyAuth, async () => 'unreachable')
      ).rejects.toBeInstanceOf(ImapAuthenticationError);

      expect(mockClose).toHaveBeenCalledTimes(1);
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it('falls back to close when logout throws during cleanup', async () => {
      mockConnect.mockImplementation(function (this: MockImapFlow) {
        this.usable = true;
        return Promise.resolve();
      });
      mockLogout.mockImplementation(() => Promise.reject(new Error('Connection dropped during logout')));
      mockClose.mockClear();
      mockLogout.mockClear();

      const result = await performImapOperation(dummyAuth, async () => 'still-succeeds');
      expect(result).toBe('still-succeeds');
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('maps network and authentication error codes correctly', async () => {
      const cases = [
        { raw: Object.assign(new Error(), { code: 'ECONNREFUSED' }), expected: ImapConnectionRefusedError },
        { raw: Object.assign(new Error(), { code: 'ENOTFOUND' }), expected: ImapHostNotFoundError },
        { raw: Object.assign(new Error(), { code: 'ETIMEDOUT' }), expected: ImapConnectionTimeoutError },
        { raw: Object.assign(new Error(), { code: 'ERR_SSL_PACKET_LENGTH_TOO_LONG' }), expected: ImapSslPacketLengthTooLongError },
        { raw: Object.assign(new Error(), { authenticationFailed: true }), expected: ImapAuthenticationError },
        { raw: new Error('Invalid certificate presented by server'), expected: ImapCertificateError },
        { raw: Object.assign(new Error(), { mailboxMissing: true }), expected: ImapMailboxNotFoundError },
      ];

      for (const { raw, expected } of cases) {
        mockConnect.mockImplementation(function (this: MockImapFlow) {
          this.usable = false;
          return Promise.reject(raw);
        });

        await expect(
          performImapOperation(dummyAuth, async () => 'unreachable')
        ).rejects.toBeInstanceOf(expected);
      }
    });
  });
});
