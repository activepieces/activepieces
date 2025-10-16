import { createAction, Property } from '@activepieces/pieces-framework';
import { Client, ConnectConfig } from 'ssh2';
import { sshExecutorAuth } from '../..';


export const ssh_execute_command = createAction({
  name: 'ssh_execute_command',
  auth: sshExecutorAuth,
  displayName: 'Execute SSH Command',
  description: 'Run a bash command via SSH',
  props: {
    command: Property.LongText({
      displayName: 'Command',
      required: true,
    }),
    wait: Property.Checkbox({
      displayName: 'Wait for completion',
      required: true,
      defaultValue: true,
    })
  },
  async run(context) {
    const { command, wait } = context.propsValue;
    const { host, port, username, password } = context.auth;

    return new Promise((resolve, reject) => {
      const conn = new Client();
      let stdout = '';
      let stderr = '';

      const config: ConnectConfig = {
        host,
        port: Number(port) || 22,
        username,
        password,
      };

      conn
        .on('ready', () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }

            stream.on('data', (data:string) => (stdout += data.toString()));
            stream.stderr.on('data', (data) => (stderr += data.toString()));

            if (wait) {
              stream.on('close', (code:number, signal:string) => {
                conn.end();
                resolve({
                  exitCode: code,
                  signal,
                  stdout,
                  stderr,
                });
              });
            } else {
              resolve({ message: 'Command sent (not waiting for completion).' });
              conn.end();
            }
          });
        })
        .on('error', (err) => reject(err))
        .connect(config);
    });
  }
});
