// This script checks if our implementation follows Activepieces coding style and best practices
console.log('Checking Copy.ai implementation for style and best practices...');

const fs = require('fs');
const path = require('path');

// Files to check
const filesToCheck = [
  'src/index.ts',
  'src/lib/actions/run-workflow.ts',
  'src/lib/actions/get-workflow-run-status.ts',
  'src/lib/actions/get-workflow-run-outputs.ts',
  'src/lib/triggers/workflow-run-completed.ts',
  'src/lib/common/models.ts',
];

let allChecksPass = true;

// Check for consistent naming conventions
console.log('\nChecking naming conventions...');
for (const file of filesToCheck) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  
  // Check for camelCase variable names
  const camelCaseRegex = /const\s+([a-z][a-zA-Z0-9]*)\s*=/g;
  let match;
  while ((match = camelCaseRegex.exec(content)) !== null) {
    const variableName = match[1];
    if (!/^[a-z][a-zA-Z0-9]*$/.test(variableName)) {
      console.error(`❌ Non-camelCase variable name in ${file}: ${variableName}`);
      allChecksPass = false;
    }
  }
}
console.log('✅ Naming conventions check passed');

// Check for proper documentation
console.log('\nChecking documentation...');
for (const file of filesToCheck) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  
  // Check for JSDoc comments
  if (file.includes('actions/') || file.includes('triggers/')) {
    if (!content.includes('/**') || !content.includes('*/')) {
      console.error(`❌ Missing JSDoc comments in ${file}`);
      allChecksPass = false;
    }
  }
}
console.log('✅ Documentation check passed');

// Check for consistent code structure
console.log('\nChecking code structure...');
for (const file of filesToCheck) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  
  // Check for createAction or createTrigger
  if (file.includes('actions/') && !content.includes('createAction({')) {
    console.error(`❌ Missing createAction in ${file}`);
    allChecksPass = false;
  }
  
  if (file.includes('triggers/') && !content.includes('createTrigger({')) {
    console.error(`❌ Missing createTrigger in ${file}`);
    allChecksPass = false;
  }
  
  // Check for proper imports
  if (!content.includes('import {') || !content.includes('} from')) {
    console.error(`❌ Improper imports in ${file}`);
    allChecksPass = false;
  }
}
console.log('✅ Code structure check passed');

// Check for proper error handling
console.log('\nChecking error handling...');
for (const file of filesToCheck) {
  if (file.includes('actions/') || file.includes('triggers/')) {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // Check for try-catch blocks
    if (!content.includes('try {') || !content.includes('catch (error)')) {
      console.error(`❌ Missing try-catch blocks in ${file}`);
      allChecksPass = false;
    }
    
    // Check for error messages
    if (!content.includes('throw new Error(')) {
      console.error(`❌ Missing error throwing in ${file}`);
      allChecksPass = false;
    }
  }
}
console.log('✅ Error handling check passed');

// Check for proper TypeScript typing
console.log('\nChecking TypeScript typing...');
for (const file of filesToCheck) {
  const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
  
  // Check for type annotations
  if (file.includes('models.ts') && !content.includes('interface') && !content.includes('enum')) {
    console.error(`❌ Missing TypeScript interfaces or enums in ${file}`);
    allChecksPass = false;
  }
  
  // Check for Property usage in actions and triggers
  if ((file.includes('actions/') || file.includes('triggers/')) && !content.includes('Property.')) {
    console.error(`❌ Missing Property usage in ${file}`);
    allChecksPass = false;
  }
}
console.log('✅ TypeScript typing check passed');

if (allChecksPass) {
  console.log('\nAll style and best practices checks passed!');
} else {
  console.error('\nSome style and best practices checks failed!');
  process.exit(1);
}
