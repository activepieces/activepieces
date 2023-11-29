import { argv } from 'node:process'
import chalk from 'chalk';
import { readPackageJson } from './utils/files'
import { extractPieceFromModule } from './update-pieces-metadata/generate-metadata';
import * as fs from 'fs';
import * as path from 'path';

async function generateTranslationFile(pieceName: string) {
    let piecesJson: Record<string, string> = {};
    const pieceData = await processPackage(pieceName);
    const jsonToWrite = JSON.stringify(pieceData, null, 2);

    const translationsDir = `packages/pieces/${pieceName}/translations`;

    // Create translations folder if it doesn't exists
    if (!fs.existsSync(translationsDir)) {
        fs.mkdirSync(translationsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(translationsDir, 'en.json'), jsonToWrite, 'utf8');

    addFilePathToCrowdin(pieceName);
    updateProjectJson(pieceName);
}

async function processPackage(packageName: string): Promise<Record<string, any>> {
    const packagePath = `packages/pieces/${packageName}`;
    const packageJson = await readPackageJson(packagePath);
    const module = await import(`../../${packagePath}/src/index.ts`);
    const piece = extractPieceFromModule({ module, pieceName: packageJson.name, pieceVersion: packageJson.version });
    const metadata = { ...piece.metadata(), name: piece.name, version: piece.version };

    const result: Record<string, any> = {};

    addIfNotEmpty(metadata.description, result);

    mergeProps(result, processAuth(metadata));
    mergeProps(result, processMetadataItems(metadata.actions));
    mergeProps(result, processMetadataItems(metadata.triggers));

    return result;
}

function processAuth(items: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    addIfNotEmpty(items.auth.displayName, result);
    addIfNotEmpty(items.auth.description, result);
    mergeProps(result, processProps(items.auth.props));
    return result;
}

function processMetadataItems(items: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const item of Object.values(items)) {
        addIfNotEmpty(item.displayName, result);
        addIfNotEmpty(item.description, result);
        mergeProps(result, processProps(item.props));
    }
    return result;
}

function processProps(props: Record<string, any> | undefined): Record<string, any> {
    const result: Record<string, any> = {};
    if (props) {
        for (const prop of Object.values(props)) {
            addIfNotEmpty(prop.displayName, result);
            addIfNotEmpty(prop.description, result);
            if (prop.type === 'STATIC_DROPDOWN') {
                mergeProps(result, processStaticDropdownProp(prop));
            }
        }
    }
    return result;
}

function processStaticDropdownProp(prop: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const option of prop.options.options) {
        addIfNotEmpty(option.label, result);
    }
    return result;
}

function addIfNotEmpty(value: string, target: Record<string, any>) {
    if (value) {
        target[value] = value;
    }
}

function mergeProps(target: Record<string, any>, source: Record<string, any>) {
    Object.assign(target, source);
}


function addFilePathToCrowdin(pieceName: string) {
    const crowdinFilePath = 'crowdin.yml';

    const newFileEntry = `  {
    "source": "packages/pieces/${pieceName}/translations/en.json",
    "translation": "packages/pieces/${pieceName}/translations/%two_letters_code%.json"
  },\n`;

    try {
        let yamlContent = fs.readFileSync(crowdinFilePath, 'utf8');
        if (yamlContent.includes(`packages/pieces/${pieceName}/translations/en.json`)) {
            return
        }
        const insertPoint = yamlContent.lastIndexOf(']');
        yamlContent = yamlContent.slice(0, insertPoint) + newFileEntry + yamlContent.slice(insertPoint);
        fs.writeFileSync(crowdinFilePath, yamlContent, 'utf8');
    } catch (error) {
        console.error('Error while updating crowdin.yml:', error);
    }
}

function updateProjectJson(pieceName: string) {
    const projectJsonPath = `packages/pieces/${pieceName}/project.json`;
    const translationFilesPath = `packages/pieces/${pieceName}/translations/*.json`

    const fileContent = fs.readFileSync(projectJsonPath, 'utf8');
    const projectJson = JSON.parse(fileContent);

    if (projectJson.targets.build.options.assets.includes(translationFilesPath)) {
        return
    }

    projectJson.targets.build.options.assets.push(translationFilesPath);

    fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2));

}

const main = async () => {
    const [, , pieceName] = argv

    await generateTranslationFile(pieceName)

    console.log(chalk.green(`✨  Created source translation file for ${pieceName}!`));
}

main()
