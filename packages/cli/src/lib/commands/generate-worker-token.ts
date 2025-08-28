import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { nanoid } from 'nanoid';
import jwtLibrary from 'jsonwebtoken';

const KEY_ID = '1';
const ISSUER = 'activepieces';
const ALGORITHM = 'HS256';

export const generateWorkerTokenCommand = new Command('token')
  .description('Generate a JWT token for worker authentication')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'jwtSecret',
        message: 'Enter your JWT secret (should be the same as AP_JWT_SECRET used for the app server):',
        validate: (input: string) => {
          if (!input) return 'JWT secret is required';
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
      const token = jwtLibrary.sign(payload, answers.jwtSecret, {
        expiresIn,
        keyid: KEY_ID,
        algorithm: ALGORITHM,
        issuer: ISSUER,
      });

      console.log(chalk.green('\nGenerated Worker Token, Please use it in AP_WORKER_TOKEN environment variable:'));
      console.log(chalk.yellow(token));
    } catch (error) {
      console.error(chalk.red('Failed to generate token:'), error);
      process.exit(1);
    }
  });
