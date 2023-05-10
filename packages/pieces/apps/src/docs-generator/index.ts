import { readdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import sortBy from "lodash/sortBy";
import { Piece, ActionBase, PieceMetadata, TriggerBase} from '@activepieces/pieces-framework';

type PieceInfo = PieceMetadata & {
  directory: string;
}

const loadPiecesMetadata = async (): Promise<PieceInfo[]> => {
  const frameworkPackages = ['framework', 'apps', 'common']
  const piecesPath = resolve(cwd(), 'packages', 'pieces')
  const piecePackages = await readdir(piecesPath)
  const filteredPiecePackages = piecePackages.filter(d => !frameworkPackages.includes(d))

  const piecesMetadata: PieceInfo[] = [];

  for (const piecePackage of filteredPiecePackages) {
    const module = await import(`packages/pieces/${piecePackage}/src/index.ts`)
    const piece = Object.values<Piece>(module)[0]
    piecesMetadata.push({
      ...piece.metadata(),
      directory: piecePackage,
    })
  }

  return sortBy(piecesMetadata, [p => p.displayName.toUpperCase()])
}

const getCardTemplate = (title: string, description: string) => {
  return `
    <CardGroup cols={2}>
      <Card title="${title}">
        ${description}
      </Card>
    </CardGroup>
  `;
}

const getPieceCards = (items: Record<string, ActionBase> | Record<string, TriggerBase>) => {
  const itemsCards: string[] = [];

  Object.values(items).forEach(item => {
    const card = getCardTemplate(item.displayName, item.description);
    itemsCards.push(card);
  })

  return itemsCards.join('');
}

/** returns the mint.json navigation path for the docs */
const writePieceDoc = async (appsDocsFolderPath:string, p: PieceInfo, mdxTemplate: string) => {
  let docsFile = mdxTemplate.replace('TITLE', p.displayName);
  let actionsCards = getPieceCards(p.actions);
  if (!actionsCards) {
    actionsCards =
      '*No supported actions yet, please let us know if you need something on Discord so we can help out* \n';
  }
  let triggerCards = getPieceCards(p.triggers);
  if (!triggerCards) {
    triggerCards =
      '*No supported triggers yet, please let us know if you need something on Discord so we can help out* \n';
  }
  docsFile = docsFile.replace('ACTIONS', actionsCards);
  docsFile = docsFile.replace('TRIGGERS', triggerCards);
  await writeFile(
    `./docs/${appsDocsFolderPath}/${p.name}.mdx`,
    docsFile
  );
  return `${appsDocsFolderPath}/${p.name}`;
}

const writeAppsOverView = async (pieces: PieceInfo[]) => {
  let appsSnippet = "<CardGroup cols={3}>";
  pieces.forEach(piece => {
    appsSnippet += `
    <a href="https://activepieces.com/docs/pieces/apps/${piece.name}">
      <Card>
          <p align="center">
            <strong>${piece.displayName}</strong>
            <img height="75px" width="75px" src="https://cdn.activepieces.com/pieces/${piece.name}.png" />
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
    const predefinedMdxPath = `packages/pieces/${p.directory}/src/lib/${p.name}.mdx`;
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
