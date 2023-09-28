import fs from "fs";
import os from 'os';
import prompts from 'prompts';
import chalk from "chalk";
import { logger } from "../logger";

const homeDir = os.homedir();
const activePiecesDir = `${homeDir}/.activepieces/cli`;
const configFilePath = `${activePiecesDir}/config.json`;

interface AuthConfig {
  token: string;
  apiUrl: string;
}

export const authCommands = {
  async login() {
    const response = await prompts([
      {
        type: 'text',
        name: 'token',
        message: 'Please enter your bearer token:'
      },
      {
        type: 'text',
        name: 'apiUrl',
        message: 'Please enter the API URL:',
        initial: 'https://cloud.activepieces.com/api'
      }
    ]);
    if (!fs.existsSync(activePiecesDir)) {
      fs.mkdirSync(activePiecesDir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, JSON.stringify({ token: response.token, apiUrl: response.apiUrl }), 'utf8');
    logger.info(chalk.green("Authentication saved successfully."));
    return {
      token: response.token,
      apiUrl: response.apiUrl
    };
  },
  async logout() {
    fs.unlinkSync(configFilePath);
    logger.info(chalk.green("Token and API URL updated successfully."));
  },
  async getToken() : Promise<AuthConfig> {
    // Check if the config file exists
    if (fs.existsSync(configFilePath)) {
      return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    }
    // If it doesn't exist, ask the user to login
    return this.loginAuth();
  }
}