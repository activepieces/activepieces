import { Command } from 'commander';
import { createPieceCommand } from './lib/commands/create-piece';
import inquirer from 'inquirer';
const createCommand = new Command('create')
  .description('Create a new piece')
  .action(async () => {
    const questions = [
      {
        type: 'input',
        name: 'pieceName',
        message: 'Enter the piece name:',
      },
      {
        type: 'input',
        name: 'packageName',
        message: 'Enter the package name:',
        default: (answers: any) => `@activepieces/piece-${answers.pieceName}`,
        when: (answers: any) => answers.pieceName !== undefined,
      },
      {
        type: 'list',
        name: 'pieceType',
        message: 'Select the piece type:',
        choices: ['community', 'custom'],
        default: 'community',
      },
    ];

    const answers = await inquirer.prompt(questions);
    createPieceCommand(answers.pieceName, answers.packageName, answers.pieceType);
  });


const pieceCommand = new Command('pieces')
  .description('Manage pieces');

pieceCommand.addCommand(createCommand);

const program = new Command();

program.version('0.0.1').description('Activepieces CLI');

program.addCommand(pieceCommand);

program.parse(process.argv);
