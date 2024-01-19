import { Command } from 'commander';
import { createPieceCommand } from './lib/commands/create-piece';
import { createActionCommand } from './lib/commands/create-action';

const pieceCommand = new Command('pieces')
  .description('Manage pieces');

pieceCommand.addCommand(createPieceCommand);

const actionCommand = new Command('actions')
  .description('Manage actions');

actionCommand.addCommand(createActionCommand);
const program = new Command();

program.version('0.0.1').description('Activepieces CLI');

program.addCommand(pieceCommand);
program.addCommand(actionCommand);

program.parse(process.argv);
