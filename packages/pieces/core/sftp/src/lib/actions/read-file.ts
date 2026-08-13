import { sftpAuth } from '../auth';
import { endClient, getClient, getProtocolBackwardCompatibility } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import { PassThrough, Readable } from 'stream';
import { getSftpError } from './common';

// Return a Readable and let the transfer run in the background; files.write
// consumes it, so the file is never fully buffered in the sandbox. The client
// is closed in the caller's finally, once the stream has been drained.
function readFTP(client: FTPClient, filePath: string): Readable {
  const stream = new PassThrough();
  client.downloadTo(stream, filePath).catch((err) => stream.destroy(err));
  return stream;
}

function readSFTP(client: Client, filePath: string): Readable {
  const stream = new PassThrough();
  client.get(filePath, stream).catch((err) => stream.destroy(err));
  return stream;
}

export const readFileContent = createAction({
  audience: 'both',
  auth: sftpAuth,
  name: 'read_file_content',
  displayName: 'Read File Content',
  description: 'Read the content of a file.',
  aiMetadata: { description: 'Downloads one file from the connected FTP, FTPS or SFTP server by remote path and returns it as a file reference that later steps can consume. Use it to fetch the content of a file whose path you know; run List Folder Contents first when you still need to discover which paths exist. Requires an exact remote file path - it does not glob, search or recurse; read-only and idempotent.', idempotent: true },
  props: {
    filePath: Property.ShortText({
      displayName: 'File Path',
      required: true,
    }),
  },
  async run(context) {
    const client = await getClient(context.auth.props);
    const filePath = context.propsValue['filePath'];
    const fileName = filePath.split('/').pop() ?? filePath;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.props.protocol);
    try {
      let fileStream: Readable;
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          fileStream = readFTP(client as FTPClient, filePath);
          break;
        default:
        case 'sftp':
          fileStream = readSFTP(client as Client, filePath);
          break;
      }

      return {
        file: await context.files.write({
          fileName: fileName,
          data: fileStream,
        }),
      };
    }
    catch (err) {
      if (err instanceof FTPError) {
        console.error(getSftpError(err.code));
        return {
          status: 'error',
          content: null,
          error: getSftpError(err.code),
        };
      } else {
        return {
          status: 'error',
          content: null,
          error: err
        }
      }
    } finally {
      await endClient(client, context.auth.props.protocol);
    }
  },
});
