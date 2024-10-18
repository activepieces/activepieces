import { Command } from 'commander';
import { createActionCommand } from './lib/commands/create-action';
import { createPieceCommand } from './lib/commands/create-piece';
import { createTriggerCommand } from './lib/commands/create-trigger';
import { syncPieceCommand } from './lib/commands/sync-pieces';

const pieceCommand = new Command('pieces')
  .description('Manage pieces');

pieceCommand.addCommand(createPieceCommand);
pieceCommand.addCommand(syncPieceCommand)

const actionCommand = new Command('actions')
  .description('Manage actions');

actionCommand.addCommand(createActionCommand);

const triggerCommand = new Command('triggers')
  .description('Manage triggers')

triggerCommand.addCommand(createTriggerCommand)


const program = new Command();

program.version('0.0.1').description('Activepieces CLI');

program.addCommand(pieceCommand);
program.addCommand(actionCommand);
program.addCommand(triggerCommand)

program.parse(process.argv);
