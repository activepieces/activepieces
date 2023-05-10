import fs from "fs";
import axios from "axios";
import { Piece, PieceMetadataSummary, PieceType } from '@activepieces/pieces-framework';
import { execSync } from "child_process";
import chalk from "chalk";
import pino from "pino";
import FormData from 'form-data';
import Table from 'cli-table3';
import { ErrorCode } from "@activepieces/shared";
import inquirer from 'inquirer';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

const bearerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpZCI6IncxUzVGZVZVdlJhaUVwOUJTY3VpcyIsInR5cGUiOiJVU0VSIiwicHJvamVjdElkIjoiTzhMMzNrcEJxTnhNa2dNTWhwWVB1IiwiaWF0IjoxNjgzNTY0ODQxLCJleHAiOjE2ODQxNjk2NDEsImlzcyI6ImFjdGl2ZXBpZWNlcyJ9.daNP8wvbxR8acNlAAJiOBTOxtpj6WnMoYJd5ePyJID4';

interface IPublishOptions {
  pieceName: string;
}

async function publish({ pieceName }: IPublishOptions) {
  const piecePath = getPiecePath(pieceName);
  const importedPiece = Object.values<Piece>(await import(`../../pieces/${pieceName}/src/index.ts`))[0];
  const pieceMetadata = importedPiece.metadata();

  process.chdir(piecePath);
  logger.info(chalk.blue("Packaging the piece into a tar file..."));

  const npmPackOutput = JSON.parse(execSync(`npm pack --json`, { encoding: 'utf-8' }));
  const tarFileName = npmPackOutput[0].filename;

  logger.info(chalk.green(`Package ${tarFileName} created.`));

  const formData = new FormData();
  formData.append('tarFile', fs.createReadStream(`./${tarFileName}`));
  formData.append('metadata', JSON.stringify(pieceMetadata));

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${bearerToken}`
    },
  };

  try {
    const result = await axios.post('http://localhost:3000/v1/pieces', formData, config);
    logger.info(chalk.green("Publish successful."));
  } catch (e: any) {
    if (e.response.data.code === ErrorCode.PIECE_ALREADY_EXISTS) {
      logger.info(chalk.red("Piece with name and version already exists. Please increment the version in the package.json file."))
    }
  }
}

async function list() {
  logger.info(chalk.blue("Fetching pieces..."));
  const config = {
    headers: {
      'Authorization': `Bearer ${bearerToken}`
    },
  };

  const result = await axios.get('http://localhost:3000/v1/pieces', config);
  const simplifiedResult = result.data.filter((f: PieceMetadataSummary) => f.type === PieceType.PRIVATE).map((piece: PieceMetadataSummary) => ({
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

    simplifiedResult.forEach((piece: { displayName: string, version: string, name: string }) => {
      table.push([piece.name, piece.displayName, piece.version]);
    });

    logger.info("\n" + table.toString());
  }
}

async function deletePiece({ pieceName }: { pieceName: string }) {

  const answer = await inquirer.prompt({
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

    axios.delete(`http://localhost:3000/v1/pieces/${pieceName}`, config);
  } else {
    logger.info(chalk.yellow("Delete canceled."));
  }
}

function getPiecePath(pieceName: string) {
  return `dist/packages/pieces/${pieceName}`;
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'publish': {
    const pieceName = args[1];
    if (!pieceName) {
      logger.error(chalk.red("Piece name argument is missing"))
    } else {
      publish({
        pieceName,
      });
    }
    break;
  }
  case 'list':
    list();
    break;
  case 'delete': {
    const pieceName = args[1];
    if (!pieceName) {
      logger.error(chalk.red("Piece name argument is missing"))
    } else {
      deletePiece({
        pieceName,
      });
    }
    break;
  }
  default:
    logger.warn(chalk.red("Unknown command."));
    break;
}

