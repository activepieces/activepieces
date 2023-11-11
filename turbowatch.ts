import chalk from 'chalk'; // Import the chalk library
import { config } from 'dotenv';
import { watch } from 'turbowatch';

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
        onChange: async ({ spawn, first, files }) => {
          console.log(
            chalk.yellow.bold(
              '👀 Detected changes in pieces. Building... 👀 ' +
                piecePackageName
            )
          );
          if (first) {
            await spawn`nx run-many -t build --projects=${piecePackageName} --skip-nx-cache`;
            return;
          }
          await spawn`nx run-many -t build --projects=${piecePackageName} --skip-nx-cache`;

          // Print a fancy message to the console using chalk
          console.log(
            chalk.green.bold(
              '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨'
            )
          );
        },
      },
    ],
    debounce: {
      wait: 1000,
    },
  });
});
