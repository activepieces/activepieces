import { argv } from 'node:process'
import chalk from 'chalk';
import { readPackageJson } from './utils/files'
import { extractPieceFromModule } from './update-pieces-metadata/generate-metadata';
import * as fs from 'fs';
import * as path from 'path';

async function generateTranslationFile(pieceName: string) {
    const piecesJson: Record<string, any> = {};
    const pieceData = await processPackage(pieceName);
    piecesJson[pieceData.name] = { auth: pieceData.auth, actions: pieceData.actions, triggers: pieceData.triggers };
    const jsonToWrite = JSON.stringify(piecesJson, null, 2);

    const translationsDir = `packages/pieces/${pieceName}/translations`;

    // Create translations folder if it doesn't exists
    if (!fs.existsSync(translationsDir)) {
        fs.mkdirSync(translationsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(translationsDir, 'en.json'), jsonToWrite, 'utf8');

    addFilePathToCrowdin(pieceName);
}

async function processPackage(packageName: string) {
    const packagePath = `packages/pieces/${packageName}`;
    const packageJson = await readPackageJson(packagePath);

    const module = await import(`../../${packagePath}/src/index.ts`);
    const { name: pieceName } = packageJson;
    const piece = extractPieceFromModule({ module, pieceName, pieceVersion: packageJson.version });
    const metadata = { ...piece.metadata(), name: piece.name, version: piece.version };

    return {
        name: pieceName,
        auth: processAuth(metadata),
        actions: processActionsOrTriggers(metadata.actions),
        triggers: processActionsOrTriggers(metadata.triggers)
    };
}

function processAuth(items: Record<string, any>) {
    const result: Record<string, any> = {};
    result['displayName'] = items.auth.displayName;
    result['description'] = items.auth.description;

    return result;
}

function processActionsOrTriggers(items: Record<string, any>) {
    const result: Record<string, any> = {};
    for (const [key, item] of Object.entries(items)) {
        result[key] = {
            displayName: item.displayName,
            description: item.description,
            props: processProps(item.props)
        };
    }
    return result;
}

function processProps(props: Record<string, any>) {
    const result: Record<string, any> = {};
    for (const [key, prop] of Object.entries(props)) {
        let propData: Record<string, any> = { displayName: prop.displayName };
        if (prop.description) {
            propData.description = prop.description;
        }
        result[key] = propData;
    }
    return result;
}

function addFilePathToCrowdin(pieceName: string) {
    const crowdinFilePath = 'crowdin.yml';

    const newFileEntry = `  {
    "source": "packages/pieces/${pieceName}/translations/en.json",
    "translation": "packages/pieces/${pieceName}/translations/%two_letters_code%.json"
  },\n`;

    try {
        let yamlContent = fs.readFileSync(crowdinFilePath, 'utf8');
        const insertPoint = yamlContent.lastIndexOf(']');
        yamlContent = yamlContent.slice(0, insertPoint) + newFileEntry + yamlContent.slice(insertPoint);
        fs.writeFileSync(crowdinFilePath, yamlContent, 'utf8');
    } catch (error) {
        console.error('Error while updating crowdin.yml:', error);
    }
}

const main = async () => {
    const [, , pieceName] = argv

    await generateTranslationFile(pieceName)

    console.log(chalk.green(`✨  Created source translation file for ${pieceName}!`));
}

main()
