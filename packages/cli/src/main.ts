import fs from "fs";
import axios from "axios";
import { Piece, PieceType } from '@activepieces/pieces-framework';
import { execSync } from "child_process";
import chalk from "chalk";
import FormData from 'form-data';
import Table from 'cli-table3';
import { ErrorCode } from "@activepieces/shared";
import os from 'os';
import prompts from 'prompts';
import yargs from 'yargs';

const logger = console;

const apiUrl = 'http://localhost:3000';

async function getToken() {
  let token;
  const homeDir = os.homedir();
  const activePiecesDir = `${homeDir}/.activepieces`;
  const configFilePath = `${activePiecesDir}/config.json`;

  // Create the ActivePieces hidden directory if it doesn't exist
  if (!fs.existsSync(activePiecesDir)) {
    fs.mkdirSync(activePiecesDir);
  }

  // Check if the config file exists
  if (fs.existsSync(configFilePath)) {
    const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
    token = config.token;
  }

  // If token doesn't exist, ask the user to input it
  if (!token) {
    const answer = await prompts({
      type: 'text',
      name: 'token',
      message: 'Please enter your bearer token:'
    });
    token = answer.token;

    logger.info(chalk.green("Token saved successfully."));
    // Save the token to the config file for future use
    fs.writeFileSync(configFilePath, JSON.stringify({ token }), 'utf8');
  }

  return token;
}


async function publish(argv) {
  const { pieceName } = argv;
  const workdir = process.cwd();
  const pieceDirectory = `${workdir}/packages/pieces/${pieceName}`;
  if (!fs.existsSync(`${pieceDirectory}/package.json`)) {
    logger.error(chalk.red("The package.json file is missing in the current directory. Please run this command in the piece directory."));
    return;
  }
  const bearerToken = await getToken();
  const importedPiece = Object.values<Piece>(await import(`${pieceDirectory}/src/index.ts`))[0];
  const pieceMetadata = importedPiece.metadata();
  logger.info(chalk.blue("Packaging the piece into a tar file..."));

  const npmPackOutput = JSON.parse(execSync(`npm pack --json`, { encoding: 'utf-8', cwd: pieceDirectory }));
  const tarFileName = npmPackOutput[0].filename;

  logger.info(chalk.green(`Package ${tarFileName} created.`));

  const formData = new FormData();
  formData.append('tarFile', fs.createReadStream(`${pieceDirectory}/${tarFileName}`));
  formData.append('metadata', JSON.stringify(pieceMetadata));

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${bearerToken}`
    },
  };

  try {
    await axios.post(`${apiUrl}/v1/pieces`, formData, config);
    logger.info(chalk.green("Publish successful."));
  } catch (e) {
    if (e.response.data.code === ErrorCode.PIECE_ALREADY_EXISTS) {
      logger.info(chalk.red("Piece with name and version already exists. Please increment the version in the package.json file."))
    }
  }
}

async function list() {
  const bearerToken = await getToken();
  logger.info(chalk.blue("Fetching pieces..."));
  const config = {
    headers: {
      'Authorization': `Bearer ${bearerToken}`
    },
  };

  const result = await axios.get(`${apiUrl}/v1/pieces`, config);
  const simplifiedResult = result.data.filter((f) => f.type === PieceType.PRIVATE).map((piece) => ({
    name: piece.name,
    displayName: piece.displayName,
    version: piece.version
  }));
  if (simplifiedResult.length === 0) {
    logger.info(chalk.yellow("No pieces found."));
  } else {

    const table = new Table({
      head: ['Name', 'Display Name', 'Latest Version'],
      colWidths: [30, 30]
    });

    simplifiedResult.forEach((piece) => {
      table.push([piece.name, piece.displayName, piece.version]);
    });

    logger.info("\n" + table.toString());
  }
}

async function deletePiece(argv) {
  const { pieceName } = argv;
  const bearerToken = await getToken();
  const answer = await prompts({
    type: 'confirm',
    name: 'confirmDelete',
    message: `Are you sure you want to delete all versions of the '${pieceName}' piece?`
  });

  if (answer.confirmDelete) {
    logger.info(chalk.blue("Deleting piece..."));
    const config = {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      },
    };

    try {
      await axios.delete(`${apiUrl}/v1/pieces/${pieceName}`, config);
      logger.info(chalk.green(`Piece '${pieceName}' deleted.`));
    } catch (e) {
      if (e.response?.status === 404) {
        logger.info(chalk.yellow(`Piece '${pieceName}' not found.`));
      } else {
        throw e;
      }
    }
  } else {
    logger.info(chalk.yellow("Delete canceled."));
  }
}

async function auth() {
  const response = await prompts({
    type: 'text',
    name: 'token',
    message: 'Please enter your bearer token:'
  });

  const homeDir = os.homedir();
  const activePiecesDir = `${homeDir}/.activepieces`;
  const configFilePath = `${activePiecesDir}/config.json`;

  // Save the token to the config file for future use
  fs.writeFileSync(configFilePath, JSON.stringify({ token: response.token }), 'utf8');

  logger.info(chalk.green("Token updated successfully."));
}

yargs
  .command('auth', 'Prompt for and save the bearer token', auth)
  .command('publish <pieceName>', 'Package and publish a piece', (yargs) => {
    yargs.positional('pieceName', {
      describe: 'Name of the piece to publish',
      type: 'string'
    })
  }, publish)
  .command('list', 'List all published private pieces', list)
  .command('delete <pieceName>', 'Delete all versions of a published private piece', (yargs) => {
    yargs.positional('pieceName', {
      describe: 'Name of the piece to delete',
      type: 'string'
    })
  }, deletePiece)
  .demandCommand(1, 'You need to specify a command.')
  .help()
  .argv;