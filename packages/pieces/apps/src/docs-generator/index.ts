import { readdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { Piece, ActionBase, PieceMetadata, PiecePropertyMap, TriggerBase, TriggerStrategy} from '@activepieces/pieces-framework';
import { extractPieceFromModule } from "@activepieces/shared";

type PieceInfo = PieceMetadata & {
  authors: string[];
}

const loadPiecesMetadata = async (): Promise<PieceInfo[]> => {
  const frameworkPackages = ['framework', 'apps', 'common']
  const piecesPath = resolve(cwd(), 'packages', 'pieces')
  const piecePackages = await readdir(piecesPath)
  const filteredPiecePackages = piecePackages.filter(d => !frameworkPackages.includes(d))
  const piecesMetadata: PieceInfo[] = [];

  for (const piecePackage of filteredPiecePackages) {
    try{
    const module = await import(`packages/pieces/${piecePackage}/src/index.ts`)
    const packageJson = await import(`packages/pieces/${piecePackage}/package.json`)



    const piece =  await extractPieceFromModule<Piece>({
      module,
      pieceName: packageJson.name,
      pieceVersion: packageJson.version,
    })

    piecesMetadata.push({
      ...piece.metadata(),
      name: packageJson.name,
      version: packageJson.version,
      directoryName: piecePackage,
      authors: piece.authors
    })
  }catch( e){
 console.error(`Error loading piece `, e);
  }
  }

  return piecesMetadata.sort((a, b) => a.displayName.toUpperCase().localeCompare(b.displayName.toUpperCase()));
}

const capitilizeFirstLetter = (str: string) => {
  str = str.toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const fixUrls = (input: string) => {
  // find all urls and put them inside ` `
  const regex = /(https?:\/\/[^\s]+)/g;
  return input.replace(regex, '`$1`');
}

const getCardTemplate = (title: string, description: string, props: PiecePropertyMap, triggerStrategy: TriggerStrategy | undefined) => {
  return `
      <Card title="${title} ${triggerStrategy != undefined ? (triggerStrategy == TriggerStrategy.POLLING ? "(Scheduled)" : "(Instant)") : ''}" ${triggerStrategy != undefined ? (triggerStrategy == TriggerStrategy.POLLING ? 'icon="clock"' : 'icon="bolt"') : ""}>
        ${description}

        <Expandable title="Properties">
          ${Object.entries(props).map(([key, value]) => {
            return `
<ResponseField name="${value.displayName}" ${value.required ? "required" : ""} type="${capitilizeFirstLetter(value.type)}">
${value.description == undefined ? "" : fixUrls(value.description)}
</ResponseField>
            `
          }).join('')}  
        </Expandable>
      </Card>
  `;
}

const getPieceCards = (items: Record<string, ActionBase>) => {
  const itemsCards: string[] = [];

  Object.values(items).forEach(item => {
    const card = getCardTemplate(item.displayName, item.description, item.props, undefined);
    itemsCards.push(card);
  })

  return itemsCards.join('');
}

const getPieceCardsTrigger = (items: Record<string, TriggerBase>) => {
  const itemsCards: string[] = [];

  Object.values(items).forEach(item => {
    const card = getCardTemplate(item.displayName, item.description, item.props, item.type);
    itemsCards.push(card);
  })

  return itemsCards.join('');
}

/** returns the mint.json navigation path for the docs */
const writePieceDoc = async (appsDocsFolderPath:string, p: PieceInfo, mdxTemplate: string) => {
  let docsFile = mdxTemplate.replace('TITLE', p.displayName);
  if(p.authors.length != 0) {
    const authors = p.authors.map((author) => {
      const githubLink = `https://github.com/${author}`;
      return `[${author}](${githubLink})`;
    });

    const split = docsFile.split('---');
    const secondIndex = split[1].length + 3;
    const authorsText = `##### Authors: ${authors.join(', ')}\n`;
    docsFile = docsFile.slice(0, secondIndex) + '---\n\n' + authorsText + docsFile.slice(secondIndex).replace("---", "");
  }
  
  let actionsCards = getPieceCards(p.actions);
  if (!actionsCards) {
    actionsCards =
      '*No supported actions yet, please let us know if you need something on Discord so we can help out* \n';
  }
  let triggerCards = getPieceCardsTrigger(p.triggers);
  if (!triggerCards) {
    triggerCards =
      '*No supported triggers yet, please let us know if you need something on Discord so we can help out* \n';
  }
  docsFile = docsFile.replace('ACTIONS', actionsCards);
  docsFile = docsFile.replace('TRIGGERS', triggerCards);
  await writeFile(
    `./docs/${appsDocsFolderPath}/${p.directoryName}.mdx`,
    docsFile
  );
  return `${appsDocsFolderPath}/${p.directoryName}`;
}

const writeAppsOverView = async (pieces: PieceInfo[]) => {
  let appsSnippet = "<CardGroup cols={3}>";
  pieces.forEach(piece => {
    appsSnippet += `
    <a href="https://activepieces.com/docs/pieces/apps/${piece.directoryName}">
      <Card>
          <p align="center">
            <strong>${piece.displayName}</strong>
            <img height="75px" width="75px" src="${piece.logoUrl}" />
          </p>
      </Card>
    </a>
      `
  });
  appsSnippet += "</CardGroup>";
  console.log('Overview is generated');
  await writeFile('./docs/_snippets/apps.mdx', appsSnippet);
}

const main = async () => {
  const pieces = await loadPiecesMetadata();
  const mintJson: { navigation: { group: string; pages: string[] }[] } =
    JSON.parse(await readFile('./docs/mint.json', 'utf8'));

  const appsDocsFolderPath = 'pieces/apps';
  const TEMPLATE_MDX = await readFile('packages/pieces/apps/src/docs-generator/template.mdx', 'utf8');
  const appsDocsFilesPaths: string[] = [];
  for (const p of pieces) {
    const predefinedMdxPath = `packages/pieces/${p.directoryName}/src/lib/${p.directoryName}.mdx`;
    if (existsSync(predefinedMdxPath)) {
      const predefinedMdxFile = await readFile(predefinedMdxPath, 'utf8');
      appsDocsFilesPaths.push(await writePieceDoc(appsDocsFolderPath, p, predefinedMdxFile));
      console.log(p.displayName);
    }
    else {
      appsDocsFilesPaths.push(await writePieceDoc(appsDocsFolderPath, p, TEMPLATE_MDX));
    }
  }

  if (!mintJson['navigation']) {
    mintJson['navigation'] = [];
  }

  const appsGroupIndex = mintJson.navigation.findIndex((n) => n.group === 'Apps');
  const appsGroup = { group: 'Apps', pages: appsDocsFilesPaths.sort() };
  if (appsGroupIndex === -1) {
    mintJson.navigation.push(appsGroup);
  } else {
    mintJson.navigation[appsGroupIndex] = appsGroup;
  }
  await writeFile('./docs/mint.json', JSON.stringify(mintJson, null, 2));

  //////// Update Overview


  await writeAppsOverView(pieces);
  console.log('docs generated');
};

main();
