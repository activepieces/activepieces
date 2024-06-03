import { createAction, Property } from '@activepieces/pieces-framework';
import { Config, NodeSSH } from 'node-ssh';
import tmp from 'tmp';
import { writeFileSync } from 'node:fs';
import { sshAuth } from '../..';

export const runScript = createAction({
  auth: sshAuth,
  name: 'run_script',
  displayName: 'Execute Script',
  description: 'Executes a script on the remote server',
  props: {
    values: Property.Array({
      displayName: 'Values',
      required: true,
    }),
    script: Property.LongText({
      displayName: 'Script',
      required: true,
      defaultValue: '#!/bin/bash\n\necho "Hello World!"',
    }),
  },

  async run(context) {
    const auth = context.auth;
    const propsValue = context.propsValue;

    const method = auth.method;
    const host = auth.host;
    const port = auth.port;
    const username = auth.username;
    const password = auth.password;

    const script = propsValue['script'];
    const values = propsValue.values as string[];

    const ssh = new NodeSSH();

    try {
      const sshConfig: Config = {
        host,
        port,
        username,
      };

      if (method === 'password') {
        sshConfig.password = password;
      } else if (method === 'private-key') {
        sshConfig.privateKey = password;
      }

      // Create a local temp file and write script to it
      const localTempFile = tmp.fileSync();
      writeFileSync(localTempFile.name, script);

      // Connect to SSH Server
      await ssh.connect(sshConfig);

      // Get a temp file name on the remote server
      const remoteTempFileName = await ssh.execCommand(
        'mktemp activepieces-ssh-XXXXXXXX.sh'
      );
      const remoteTempFilePath = `/tmp/${remoteTempFileName.stdout}`;

      // Upload the script to the remote server
      await ssh.putFile(localTempFile.name, remoteTempFilePath);
      await ssh.execCommand(`chmod +x ${remoteTempFilePath}`);

      // Execute the script on the remote server
      const results = await ssh.exec(remoteTempFilePath, values);

      // Delete the temp file on the remote server
      await ssh.execCommand(`rm ${remoteTempFilePath}`);

      // Delete the local temp file
      localTempFile.removeCallback();

      return {
        status: 'success',
        results,
      };
    } catch (err) {
      console.error(err);
      return {
        status: 'error',
        error: err instanceof Error ? err.message : err,
      };
    } finally {
      // Disconnect from SSH Server
      await ssh.dispose();
    }
  },
});
