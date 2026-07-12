import { sftpAuth } from '../auth';
import { endClient, getClient, getProtocolBackwardCompatibility } from '../common';
import { FilesService, Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import { PassThrough } from 'stream';
import { getSftpError } from './common';

// Bridge the client's write-into-a-stream API to writeStream's read-from-a-stream
// API with a PassThrough, so bytes never buffer in the engine.
async function readToStorage({ download, files, fileName }: { download: (sink: PassThrough) => Promise<void>; files: FilesService; fileName: string }): Promise<string> {
  const sink = new PassThrough();
  const feed = download(sink).catch((err) => {
    sink.destroy(err instanceof Error ? err : new Error(String(err)));
    throw err;
  });
  const [fileUrl] = await Promise.all([
    files.writeStream({ fileName, stream: sink }),
    feed,
  ]);
  return fileUrl;
}

export const readFileContent = createAction({
  audience: 'human',
  auth: sftpAuth,
  name: 'read_file_content',
  displayName: 'Read File Content',
  description: 'Read the content of a file.',
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
      const download = async (sink: PassThrough) => {
        switch (protocolBackwardCompatibility) {
          case 'ftps':
          case 'ftp':
            await (client as FTPClient).downloadTo(sink, filePath);
            break;
          default:
          case 'sftp':
            await (client as Client).get(filePath, sink);
            break;
        }
        // basic-ftp leaves the sink open; end it so writeStream sees EOF (no-op if already ended).
        sink.end();
      };

      return {
        file: await readToStorage({ download, files: context.files, fileName }),
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
