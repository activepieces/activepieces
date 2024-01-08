import chalk from 'chalk'; // Import the chalk library
import { config } from 'dotenv';
import { watch } from 'turbowatch';
import { exec } from 'child_process';

config({ path: 'packages/backend/.env' });

const packages = process.env.AP_DEV_PIECES?.split(',') || [];

packages.forEach((packageName) => {
  console.log(chalk.blue(`Starting Turbowatch for package: ${packageName}`));

  // Define the inline configuration
  const piecePackageName = `pieces-${packageName}`;
  void watch({
    project: `${__dirname}/packages/pieces/${packageName}`,
    triggers: [
      {
        expression: ['match', '**/*.ts', 'basename'],
        name: `build-pieces-${packageName}`,
        initialRun: true,
        interruptible: false,
        persistent: false,
        onChange: async () => {
          console.log(
            chalk.yellow.bold(
              '👀 Detected changes in pieces. Building... 👀 ' +
              piecePackageName
            )
          );
          exec(`nx run-many -t build --projects=${piecePackageName} --skip-nx-cache`, (error, stdout, stderr) => {
            if (error || stderr) {
              console.error(chalk.red.bold('Failed to run turbowatch...', error, stderr));
              return;
            }
            // Print a fancy message to the console using chalk
            console.log(
              chalk.green.bold(
                '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨'
              )
            );
          });
        },
      },
    ],
    debounce: {
      wait: 1000,
    },
  });
});