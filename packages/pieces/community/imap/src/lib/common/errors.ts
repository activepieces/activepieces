export interface ImapClientError extends Error {
  code?: string;
  responseText?: string;
}

export class ImapError extends Error {
  constructor(message: string) {
    super(`IMAP error: ${message}`);
    this.name = 'ImapGenericError';
  }
}

export class ImapAuthenticationError extends ImapError {
  constructor() {
    super('Authentication failed. Check username and password.');
    this.name = 'ImapAuthenticationError';
  }
}

export class ImapConnectionLostError extends ImapError {
  constructor() {
    super('IMAP connection lost while fetching emails.');
    this.name = 'ImapConnectionLostError';
  }
}

export class ImapConnectionRefusedError extends ImapError {
  constructor() {
    super('Connection refused. Check host and port settings.');
    this.name = 'ImapConnectionRefusedError';
  }
}

export class ImapConnectionTimeoutError extends ImapError {
  constructor() {
    super(
      'Connection timed out. Check network connectivity and server availability.'
    );
    this.name = 'ImapConnectionTimeoutError';
  }
}

export class ImapCertificateError extends ImapError {
  constructor() {
    super(
      'TLS certificate validation failed. Consider disabling certificate validation for testing.'
    );
    this.name = 'ImapCertificateError';
  }
}

export class ImapHostNotFoundError extends ImapError {
  constructor() {
    super('Host not found. Please verify the IMAP server address.');
    this.name = 'ImapHostNotFoundError';
  }
}

export class ImapMailboxNotFoundError extends ImapError {
  constructor() {
    super('The specified mailbox/folder does not exist on the server.');
    this.name = 'ImapMailboxNotFoundError';
  }
}

export class ImapSslPacketLengthTooLongError extends ImapError {
  constructor() {
    super('SSL packet length too long. The specified server port is probably incorrect.');
    this.name = 'ImapSslPacketLengthTooLongError';
  }
}
