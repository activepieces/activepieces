import { Command } from 'commander';
import { createActionCommand } from './lib/commands/create-action.ts';
import { createPieceCommand } from './lib/commands/create-piece.ts';
import { createTriggerCommand } from './lib/commands/create-trigger.ts';
import { syncPieceCommand } from './lib/commands/sync-pieces.ts';
import { publishPieceCommand } from './lib/commands/publish-piece.ts';
import { buildPieceCommand } from './lib/commands/build-piece.ts';
import { generateWorkerTokenCommand } from './lib/commands/generate-worker-token.ts';
import { generateTranslationFileForAllPiecesCommand, generateTranslationFileForPieceCommand } from './lib/commands/generate-translation-file-for-piece.ts';

const pieceCommand = new Command('pieces')
  .description('Manage pieces');

pieceCommand.addCommand(createPieceCommand);
pieceCommand.addCommand(syncPieceCommand);
pieceCommand.addCommand(publishPieceCommand);
pieceCommand.addCommand(buildPieceCommand);
pieceCommand.addCommand(generateTranslationFileForPieceCommand);
pieceCommand.addCommand(generateTranslationFileForAllPiecesCommand);
const actionCommand = new Command('actions')
  .description('Manage actions');

actionCommand.addCommand(createActionCommand);

const triggerCommand = new Command('triggers')
  .description('Manage triggers')

triggerCommand.addCommand(createTriggerCommand)


const workerCommand = new Command('workers')
  .description('Manage workers')

workerCommand.addCommand(generateWorkerTokenCommand)

const program = new Command();

program.version('0.0.1').description('Activepieces CLI');

program.addCommand(pieceCommand);
program.addCommand(actionCommand);
program.addCommand(triggerCommand);
program.addCommand(workerCommand);
program.parse(process.argv);
