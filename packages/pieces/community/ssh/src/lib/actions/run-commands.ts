import { sshAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { connectToSSH, disposeSSH, SSHAuth } from '../common/common';

enum ExecutionMode {
  SEQUENTIAL = 'Sequentially',
  PARALLEL = 'Parallel',
}

export const runCommands = createAction({
  name: 'run-commands',
  displayName: 'Run Commands',
  description: 'Runs SSH commands',
  auth: sshAuth,
  props: {
    executionMode: Property.StaticDropdown<ExecutionMode>({
      displayName: 'Execute commands sequentially or parallel',
      description: 'Whether to execute the commands sequentially or parallel',
      required: true,
      defaultValue: ExecutionMode.SEQUENTIAL,
      options: {
        options: [
          {
            label: 'Sequentially',
            value: ExecutionMode.SEQUENTIAL,
          },
          {
            label: 'Parallel',
            value: ExecutionMode.PARALLEL,
          }
        ]
      }
    }),
    commands: Property.LongText({
      displayName: 'Commands',
      description: 'The commands to run',
      required: true,
    }),
  },
  async run(context) {
    const { commands, executionMode } = context.propsValue
    return executeCommands(context.auth, commands, executionMode!)
  }
});

const executeCommands = async (auth: SSHAuth, commands: string, executionMode: ExecutionMode) => {
  const ssh = await connectToSSH(auth)

  const commandsList = getCommandsToRun(commands, executionMode)

  const results = await Promise.all(commandsList.map(async (command) => { 
    const result = await ssh.execCommand(command);
    return { stdout: result.stdout, stderr: result.stderr }
  }))
  
  // await disposeSSH(ssh)
  return results
}

function getCommandsToRun(commands: string, executionMode: ExecutionMode) {
  switch (executionMode) {
    case ExecutionMode.SEQUENTIAL:
      return [commands.split('\n').join(' && ')];

    case ExecutionMode.PARALLEL:
      return commands.split('\n');
  }
} 