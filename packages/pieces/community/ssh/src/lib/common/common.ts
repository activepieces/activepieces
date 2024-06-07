import { NodeSSH } from "node-ssh"

export type SSHAuth = {
    username: string
    passcodeType: 'password' | 'private-key' | undefined
    passcode: string
    host: string
    port: number
}


export async function connectToSSH(auth: SSHAuth) {
    const ssh = new NodeSSH()

    const { username, passcodeType, passcode, port, host } = auth

    const sshOptions = {
        host,
        username,
        ...(passcodeType === 'private-key'
            ? { privateKey: passcode }
            : { password: passcode }),
        port
    };

    await ssh.connect(sshOptions)
    return ssh
}

export const disposeSSH = async (ssh: NodeSSH): Promise<void> => {
    try {
      ssh.dispose();
    } catch (error) {
      throw error;
    }
  };
  