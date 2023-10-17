import { defineConfig, type ChangeEvent } from 'turbowatch';
import chalk from 'chalk'; // Import chalk for styling console messages
import { config } from 'dotenv'; // Import the dotenv library

config({ path: 'packages/backend/.env' });

export default defineConfig({
    project: `${__dirname}/packages/pieces`,
    triggers: [
        {
            expression: ['match', '*.ts', 'basename'],
            name: 'build-pieces',
            initialRun: true,
            interruptible: false,
            persistent: false,
            onChange: async ({ spawn, first, files }: ChangeEvent) => {
                const pieces = process.env.AP_DEV_PIECES?.split(',').map(p => `pieces-${p}`).join(',');

                console.log(chalk.yellow.bold('👀 Detected changes in pieces. Building... 👀 ' + pieces))
                if (first) {
                    await spawn`nx run-many -t build --projects=${pieces} --skip-cache`;
                    return;
                }

                const projects = files
                    .map(file => {
                        const fileNameRegex = /^.+pieces\/(?<pieceName>.+)\/src.+$/
                        const matchResult = file.name.match(fileNameRegex)
                        const pieceName = matchResult?.groups?.pieceName
                        return `pieces-${pieceName}`;
                    })
                    .filter(Boolean)
                    .join(',');

                await spawn`nx run-many -t build --projects=${projects} --skip-cache`;

                // Print a fancy message to the console using chalk
                console.log(chalk.green.bold('✨ Changes are ready! Please refresh the frontend to see the new updates. ✨'));
            },
        },
    ],
    debounce: {
        wait: 1000,
    },
});
