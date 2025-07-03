import { endClient, sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient } from 'basic-ftp';
import { getClient, getProtocolBackwardCompatibility } from '../..';
import { Writable } from 'stream';

async function readFTP(client: FTPClient, filePath: string) {
  const chunks: Buffer[] = [];
  const writeStream = new Writable({
    write(chunk: Buffer, _encoding: string, callback: () => void) {
      chunks.push(chunk);
      callback();
    }
  });
  await client.downloadTo(writeStream, filePath);
  return Buffer.concat(chunks);
}

async function readSFTP(client: Client, filePath: string) {
  const fileContent = await client.get(filePath);
  await client.end();
  return fileContent as Buffer;
}

export const readFileContent = createAction({
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
    const client = await getClient(context.auth);
    const filePath = context.propsValue['filePath'];
    const fileName = filePath.split('/').pop() ?? filePath;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.protocol);
    try {
      let fileContent: Buffer;
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          fileContent = await readFTP(client as FTPClient, filePath);
          break;
        default:
        case 'sftp':
          fileContent = await readSFTP(client as Client, filePath);
          break;
      }

      return {
        file: await context.files.write({
          fileName: fileName,
          data: fileContent,
        }),
      };
    } catch (err) {
      return {
        success: false,
        error: err,
      };
    } finally {
      await endClient(client, context.auth.protocol);
    }
  },
});
