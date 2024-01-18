import chalk from 'chalk';
import { Command } from 'commander';
import { createPieceCommand } from './lib/commands/create-piece';

const program = new Command();

program.version('0.0.1').description('Activepieces CLI');

program
  .command('create-piece')
  .argument('<pieceName>', 'piece name')
  .argument('<packageName>', 'package name')
  // .argument('<pieceType>', 'piece type either can be community or custom.')
  .requiredOption('-t --type <pieceType>', 'piece type')
  .action(async (pieceName, packageName, options) => {
    // console.log(pieceName, packageName, options.type);
    createPieceCommand(pieceName, packageName, options.type);
    console.log(chalk.green('✨  Done!'));
    console.log(
      chalk.yellow(
        `The piece has been generated at: packages/pieces/${options.type}/${pieceName}`
      )
    );
  });

program.parse(process.argv);
