
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
    import { ssh_execute_command } from "./lib/actions/ssh_execute_command"

    
    export const sshExecutorAuth = PieceAuth.CustomAuth({
      description: 'SSH authentication',
      props: {
        host: Property.ShortText({ displayName: 'Host', required: true }),
        port: Property.Number({ displayName: 'Port', defaultValue: 22, required: false }),
        username: PieceAuth.SecretText({ displayName: 'Username', required: true }),
        password: PieceAuth.SecretText({ displayName: 'Password', required: true })
      },
      required: true,
    });

    export const sshExecutor = createPiece({
      displayName: "SSH Executor",
      auth: sshExecutorAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/ssh-executor.png",
      authors: ['hd99'],
      actions: [ssh_execute_command],
      triggers: [],
    });
    