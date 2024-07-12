import chalk from 'chalk'; // Import the chalk library
import { config } from 'dotenv';
import { watch } from 'turbowatch';
import { exec, execSync } from 'child_process';
import { findPieceDirectoryInSource } from '../utils/piece-script-utils';
import path from 'path';
import { assertNotNullOrUndefined } from '../../../packages/shared/src';
import { Mutex } from 'async-mutex';

config({ path: 'packages/server/api/.env' });

const mutex = new Mutex();
const packages = process.env.AP_DEV_PIECES?.split(',') || [];
const processes: Record<string, any> = {};

async function main() {
  for (const packageName of packages) {
    console.log(chalk.blue(`Starting Turbowatch for package: ${packageName}`));
    // Define the inline configuration
    const pieceDirectory = await findPieceDirectoryInSource(packageName);
    assertNotNullOrUndefined(pieceDirectory, 'pieceDirectory');
    console.debug(chalk.yellow(`Found piece directory: ${pieceDirectory}`));
    const piecePackageName = `pieces-${packageName}`;
    void watch({
      project: path.resolve(pieceDirectory),
      triggers: [
        {
          expression: ['match', '**/*.ts', 'basename'],
          name: `build-pieces-${packageName}`,
          initialRun: true,
          interruptible: true,
          persistent: false,
          onChange: async () => {
            console.log(
              chalk.yellow.bold(
                '👀 Detected changes in pieces. Waiting... 👀 ' +
                piecePackageName
              )
            );
            try {
              await mutex.acquire();

              const cmd = `nx run-many -t build --projects=${piecePackageName} --skip-nx-cache`
              console.log(chalk.yellow.bold("🤌 Building pieces... 🤌"))
              console.log(chalk.yellow("Running Command " + cmd))

              if (processes[piecePackageName]) {
                processes[piecePackageName].kill('SIGTERM');
                console.log(chalk.red.bold('Previous build process terminated.'));
              }
              processes[piecePackageName] = execSync(cmd, {
                stdio: 'inherit',
              })
            } catch (error) {
              console.error(chalk.red.bold('Failed to run turbowatch...'), error.stdout.toString(), error.stderr.toString());

            } finally {
              mutex.release();
              // Print a fancy message to the console using chalk
              console.log(
                chalk.green.bold(
                  '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨'
                )
              );
            }
          },
        },
      ],
      debounce: {
        wait: 1000,
      },
    });
  }
}

process.on('SIGINT', () => {
  console.log(chalk.red.bold('Process terminated by user.'));
  for (const process of Object.values(processes)) {
    process.kill('SIGTERM');
  }
  process.exit();
});

main();
