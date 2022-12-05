import {readFileSync} from 'fs';
import {CodeExecutor} from './codeExecuter';

function getFlowConfig() {
  const file = readFileSync('./resources/flow.json', 'utf-8');
  return JSON.parse(file.toString());
}

async function main() {
  let codeExecutor = new CodeExecutor("/home/shahed/IdeaProjects/flow-executer/sample/project", "project.tar.gz");
  codeExecutor.prepareExecution();
  console.log(await codeExecutor.executeCode());

}
main();
//console.log(getFlowConfig());
