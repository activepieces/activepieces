import { Command } from 'commander';
import { createPieceCommand } from './lib/commands/create-piece';

const program = new Command();

program.version('0.0.1').description('Activepieces CLI');

program
  .command('create-piece')
  .argument('<pieceName>', 'piece name')
  .argument('<packageName>', 'package name')
  .requiredOption(
    '-t --type <pieceType>',
    'piece type either can be community or custom.'
  )
  .action(async (pieceName, packageName, options) => {
    createPieceCommand(pieceName, packageName, options.type);
  });

program.parse(process.argv);
