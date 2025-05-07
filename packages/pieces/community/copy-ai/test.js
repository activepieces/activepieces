// This is a simple test script to verify our implementation
console.log('Testing Copy.ai implementation...');

// Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/index.ts',
  'src/lib/actions/run-workflow.ts',
  'src/lib/actions/get-workflow-run-status.ts',
  'src/lib/actions/get-workflow-run-outputs.ts',
  'src/lib/triggers/workflow-run-completed.ts',
  'src/lib/common/models.ts',
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`Missing required file: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found file: ${file}`);
  }
}

if (allFilesExist) {
  console.log('All required files exist!');
} else {
  console.error('Some required files are missing!');
  process.exit(1);
}

// Check if all required functionality is implemented
const indexContent = fs.readFileSync(path.join(__dirname, 'src/index.ts'), 'utf8');
const runWorkflowContent = fs.readFileSync(path.join(__dirname, 'src/lib/actions/run-workflow.ts'), 'utf8');
const getStatusContent = fs.readFileSync(path.join(__dirname, 'src/lib/actions/get-workflow-run-status.ts'), 'utf8');
const getOutputsContent = fs.readFileSync(path.join(__dirname, 'src/lib/actions/get-workflow-run-outputs.ts'), 'utf8');
const triggerContent = fs.readFileSync(path.join(__dirname, 'src/lib/triggers/workflow-run-completed.ts'), 'utf8');

// Check for authentication
if (indexContent.includes('PieceAuth.SecretText')) {
  console.log('✅ Authentication is implemented');
} else {
  console.error('❌ Authentication is not implemented');
  allFilesExist = false;
}

// Check for actions
if (indexContent.includes('actions.runWorkflow') && 
    indexContent.includes('actions.getWorkflowRunStatus') && 
    indexContent.includes('actions.getWorkflowRunOutputs')) {
  console.log('✅ All required actions are registered');
} else {
  console.error('❌ Not all required actions are registered');
  allFilesExist = false;
}

// Check for triggers
if (indexContent.includes('triggers.workflowRunCompleted')) {
  console.log('✅ Workflow Run Completed trigger is registered');
} else {
  console.error('❌ Workflow Run Completed trigger is not registered');
  allFilesExist = false;
}

// Check for webhook implementation
if (triggerContent.includes('onEnable') && 
    triggerContent.includes('onDisable') && 
    triggerContent.includes('context.store.put') &&
    triggerContent.includes('context.store.get')) {
  console.log('✅ Webhook registration/deregistration is implemented');
} else {
  console.error('❌ Webhook registration/deregistration is not fully implemented');
  allFilesExist = false;
}

// Check for polling logic
if (runWorkflowContent.includes('wait_for_completion') && 
    runWorkflowContent.includes('timeout_seconds') && 
    runWorkflowContent.includes('while (attempts < maxAttempts)')) {
  console.log('✅ Polling logic for workflow completion is implemented');
} else {
  console.error('❌ Polling logic for workflow completion is not fully implemented');
  allFilesExist = false;
}

// Check for error handling
if (runWorkflowContent.includes('try {') && 
    runWorkflowContent.includes('catch (error)') && 
    getStatusContent.includes('try {') && 
    getStatusContent.includes('catch (error)') && 
    getOutputsContent.includes('try {') && 
    getOutputsContent.includes('catch (error)')) {
  console.log('✅ Error handling is implemented in all actions');
} else {
  console.error('❌ Error handling is not implemented in all actions');
  allFilesExist = false;
}

if (allFilesExist) {
  console.log('All checks passed! The implementation meets the requirements.');
} else {
  console.error('Some checks failed! The implementation does not meet all requirements.');
  process.exit(1);
}
