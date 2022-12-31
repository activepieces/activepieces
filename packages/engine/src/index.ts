import { FlowExecutor } from './executors/flow-executor';
import { Utils } from './utils';
import { globals } from './globals';
import { ExecutionState, StepOutput } from 'shared';
import axios, { AxiosError } from 'axios';

const args = process.argv.slice(2);

function executeFlow() {
  try {
    const input: {
      flowVersionId: string;
      collectionVersionId: string;
      workerToken: string;
      apiUrl: string;
      triggerPayload: StepOutput;
    } = Utils.parseJsonFile(globals.inputFile);

    globals.workerToken = input.workerToken;
    globals.apiUrl = input.apiUrl;

    const executionState = new ExecutionState();
    executionState.insertStep(input.triggerPayload, 'trigger', []);
    const executor = new FlowExecutor(executionState);
    executor
      .executeFlow(input.collectionVersionId, input.flowVersionId)
      .then((output) => {
        Utils.writeToJsonFile(globals.outputFile, output);
      });
  } catch (e) {
    Utils.writeToJsonFile(globals.outputFile, (e as Error).message);
  }
}

async function execute() {
  const data = await axios.get(
    'http://localhost:3000/v1/store-entries?key=hello',
    {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ.eyJpZCI6ImI2ejdrZ2RWQUpMWEsybXhXN3hEaCIsInR5cGUiOiJXT1JLRVIiLCJjb2xsZWN0aW9uSWQiOiJodjl5UXY3RHVQUE45dG1lUHEzMWoiLCJpYXQiOjE2NzI0NDQ1NDIsImV4cCI6MTY3MzA0OTM0MiwiaXNzIjoiYWN0aXZlcGllY2VzIn0.EvKyxntiTjx-rjOlz69MURzbhvR-nHhP_tYdHUbbM9E'
      }
    }
  );
  console.log(data.data);
  /**   switch (args[0]) {
    case 'execute-flow':
      executeFlow();
      break;
    default:
      break;
    }**/
}

execute();
