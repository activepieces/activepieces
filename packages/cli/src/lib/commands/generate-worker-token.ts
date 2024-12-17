import { Command } from 'commander';
import * as jwt from 'jsonwebtoken';
import chalk from 'chalk';
import { prompt } from 'inquirer';
import { nanoid } from 'nanoid';

export const generateWorkerTokenCommand = new Command('token')
    .description('Generate a JWT token for worker authentication')
    .action(async () => {
        const answers = await prompt([
            {
                type: 'input',
                name: 'jwtSecret',
                message: 'Enter your JWT secret:',
                validate: (input) => {
                    if (!input) {
                        return 'JWT secret is required';
                    }
                    return true;
                }
            }
        ]);

        const payload = {
            id: nanoid(),
            type: 'WORKER',
        };

        // 100 years in seconds
        const expiresIn = 100 * 365 * 24 * 60 * 60;

        try {
            const token = jwt.sign(payload, answers.jwtSecret, { expiresIn });
            console.log(chalk.green('\nGenerated Worker Token, Please use it in AP_WORKER_TOKEN environment variable:'));
            console.log(chalk.yellow(token));
           
        } catch (error) {
            console.error(chalk.red('Failed to generate token:'), error);
            process.exit(1);
        }
    }); 