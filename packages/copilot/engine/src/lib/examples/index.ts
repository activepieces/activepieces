import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { FlowTemplate } from '@activepieces/shared';

function processExample(example: FlowTemplate): any {
    let step = example.template.trigger;
    const finalSteps = []
    while (step) {
        finalSteps.push({
            name: step.displayName,
            type: step.type,
        });
        step = step.nextAction;
    }
    return {
        name: example.name,
        steps: finalSteps,
    };
}

export function compileExamples() {
    console.log(chalk.blue('Starting example compilation...'));
    
    const originalDir = path.join(process.cwd(), 'packages', 'copilot', 'src', 'lib', 'examples', 'original');
    const compiledDir = path.join(process.cwd(), 'packages', 'copilot', 'src', 'lib', 'examples', 'compiled');

    if (fs.existsSync(compiledDir)) {
        fs.rmSync(compiledDir, { recursive: true });
    }
    fs.mkdirSync(compiledDir);

    const files = fs.readdirSync(originalDir)
        .filter(file => file.endsWith('.json'));

    let completed = 0;
    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const originalPath = path.join(originalDir, file);
        const compiledPath = path.join(compiledDir, file);

        // Read original file
        const content = fs.readFileSync(originalPath, 'utf-8');
        const example = JSON.parse(content);

        // Process the example
        const processedExample = processExample(example);

        // Write to compiled directory
        fs.writeFileSync(
            compiledPath,
            JSON.stringify(processedExample, null, 2)
        );
        completed++;
    }

    console.log(chalk.green.bold(`Example compilation complete! Processed ${completed} examples`));
}
