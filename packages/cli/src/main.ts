import yargs from 'yargs';
import { authCommands } from "./lib/commands/auth";
import { pieceCommands } from "./lib/commands/piece";

yargs
  .command('auth', 'Authenticate with ActivePieces', (yargs) => {
    yargs.command('login', 'Login to ActivePieces', authCommands.login)
      .command('logout', 'Logout from ActivePieces', authCommands.logout)
      .demandCommand(1, 'You need to specify a command.')
  })
  .command('pieces', 'Manage pieces', (yargs) => {
    yargs.command('list', 'List pieces', pieceCommands.list)
      .command('delete <pieceName>', 'Delete a piece', { pieceName: { type: 'string', demandOption: true } }, pieceCommands.delete)
      .command('publish <pieceName>', 'Publish a piece', { pieceName: { type: 'string', demandOption: true } }, pieceCommands.publish)
      .demandCommand(1, 'You need to specify a command.')
  })
  .demandCommand(1, 'You need to specify a command.')
  .help()
  .argv;

