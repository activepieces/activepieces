import { isNil } from '@activepieces/shared';
import Client from 'ssh2-sftp-client';
import { ServerHostKeyAlgorithm } from 'ssh2';
import { Client as FTPClient } from 'basic-ftp';

export async function getProtocolBackwardCompatibility(protocol: string | undefined) {
  if (isNil(protocol)) {
    return 'sftp';
  }
  return protocol;
}

export async function getClient<T extends Client | FTPClient>(auth: { protocol: string | undefined, host: string, port: number, allow_unauthorized_certificates: boolean | undefined, allow_anonymous_login: boolean | undefined, username: string, password: string | undefined, privateKey: string | undefined, algorithm: ServerHostKeyAlgorithm[] | string[] | undefined }): Promise<T> {
  const { protocol, host, port, allow_unauthorized_certificates, allow_anonymous_login, username, password, privateKey, algorithm } = auth;
  const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(protocol);
  if (protocolBackwardCompatibility === 'sftp') {
    const sftp = new Client();

    if (privateKey) {
      // Handle literal \n strings (from users who manually escaped newlines)
      let processedKey = privateKey
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();

      // Handle case where browser input converts newlines to spaces
      // Detect if key is on a single line (no newlines) but has PEM markers
      if (!processedKey.includes('\n') && processedKey.match(/-----BEGIN [A-Z0-9 ]+ KEY-----.*-----END [A-Z0-9 ]+ KEY-----/)) {
        // Split on spaces that appear after key markers or base64 content
        // PEM format: header, optional encryption info, blank line, base64 (64 chars/line), footer
        processedKey = processedKey
          // Add newline after BEGIN header
          .replace(/(-----BEGIN [A-Z0-9 ]+ KEY-----)\s+/, '$1\n')
          // Add newline after Proc-Type header
          .replace(/(Proc-Type:\s*\S+)\s+/, '$1\n')
          // Add newline after DEK-Info header (followed by blank line)
          .replace(/(DEK-Info:\s*\S+)\s+/, '$1\n\n')
          // Add newline before END footer
          .replace(/\s+(-----END [A-Z0-9 ]+ KEY-----)/, '\n$1');

        // Now handle the base64 content - split into 64-char lines
        const beginMatch = processedKey.match(/(-----BEGIN [A-Z0-9 ]+ KEY-----\n(?:Proc-Type:[^\n]+\n)?(?:DEK-Info:[^\n]+\n\n)?)/);
        const endMatch = processedKey.match(/(\n-----END [A-Z0-9 ]+ KEY-----)/);
        if (beginMatch && endMatch) {
          const header = beginMatch[1];
          const footer = endMatch[1];
          const base64Content = processedKey
            .replace(header, '')
            .replace(footer, '')
            .replace(/\s+/g, ''); // Remove all whitespace from base64

          // Split base64 into 64-character lines
          const lines = base64Content.match(/.{1,64}/g) || [];
          processedKey = header + lines.join('\n') + footer;
        }
      }

      const connectOptions: Client.ConnectOptions = {
        host,
        port,
        username,
        privateKey: processedKey,
        timeout: 10000,
      };
      if (password) {
        connectOptions.passphrase = password;
      }
      if (algorithm && algorithm.length > 0) {
        connectOptions.algorithms = {
          serverHostKey: algorithm as ServerHostKeyAlgorithm[]
        };
      }
      await sftp.connect(connectOptions);
    }
    else if (password) {
      await sftp.connect({
        host,
        port,
        username,
        password,
        timeout: 10000,
      });
    }

    return sftp as T;
  } else {
    const ftpClient = new FTPClient();
    await ftpClient.access({
      host,
      port,
      user: username,
      password,
      secure: protocolBackwardCompatibility === 'ftps',
      secureOptions: {
        rejectUnauthorized: !(allow_unauthorized_certificates ?? false),
      }
    });
    return ftpClient as T;
  }
}

export async function endClient(client: Client | FTPClient, protocol: string | undefined) {
  const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(protocol);
  if (protocolBackwardCompatibility === 'sftp') {
    await (client as Client).end();
  } else {
    (client as FTPClient).close();
  }
}
