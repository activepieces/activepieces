
import * as fs from 'fs';
import { pieces } from '../apps';
import { Action } from '../framework/action/action';
import { Piece } from '../framework/piece';
import { Trigger } from '../framework/trigger/trigger';

const mintJson: { navigation: { group: string; pages: string[] }[] } =
  JSON.parse(fs.readFileSync('./docs/mint.json', 'utf8'));
const appsDocsFolderPath = 'pieces/apps';

function getCardTemplate(title: string, description: string) {
  const CARD_TEMPLATE = `
    <CardGroup cols={2}>
      <Card title="${title}">
        ${description}
      </Card>
    </CardGroup>
    `;
  return CARD_TEMPLATE;
}

function getPieceCards(
  items: Record<string, Action> | Record<string, Trigger>
) {
  const itemsNames = Object.keys(items);
  const itemsCards = itemsNames
    .map((itemName) => {
      const title = items[itemName].displayName;
      const description = items[itemName].description;
      return getCardTemplate(title, description);
    })
    .join('');
  return itemsCards;
}
/** returns the mint.json navigation path for the docs */
function writePieceDoc(p: Piece, mdxTemplate: string) {
  let docsFile = mdxTemplate.replace('TITLE', p.displayName);
  let actionsCards = getPieceCards(p.metadata().actions);
  if (!actionsCards) {
    actionsCards =
      '*No supported actions yet, please let us know if you need something on Discord so we can help out* \n';
  }
  let triggerCards = getPieceCards(p.metadata().triggers);
  if (!triggerCards) {
    triggerCards =
      '*No supported triggers yet, please let us know if you need something on Discord so we can help out* \n';
  }
  docsFile = docsFile.replace('ACTIONS', actionsCards);
  docsFile = docsFile.replace('TRIGGERS', triggerCards);
  fs.writeFileSync(
    `./docs/${appsDocsFolderPath}/${p.metadata().name}.mdx`,
    docsFile
  );
  return `${appsDocsFolderPath}/${p.metadata().name}`;
}


const TEMPLATE_MDX = fs.readFileSync('packages/pieces/src/lib/docs-generator/template.mdx', 'utf8');
const appsDocsFilesPaths: string[] = [];
pieces.forEach((p) => {
  const predefinedMdxPath = `packages/pieces/src/lib/apps/${p.name}/${p.name}.mdx`;
  if (fs.existsSync(predefinedMdxPath)) {
    const predfinedMdxFile = fs.readFileSync(predefinedMdxPath, 'utf8');
    appsDocsFilesPaths.push(writePieceDoc(p, predfinedMdxFile));
    console.log(p.displayName);
  }
  else {
    appsDocsFilesPaths.push(writePieceDoc(p, TEMPLATE_MDX));
  }
});
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
fs.writeFileSync('./docs/mint.json', JSON.stringify(mintJson, null, 2));

//////// Update Overview


writeAppsOverView();
console.log('docs generated');

function writeAppsOverView() {
  let appsSnippet = "<CardGroup cols={3}>";
  pieces.forEach(piece => {
    appsSnippet += `
    <Card>
      <p align="center">
        <strong>${piece.displayName}</strong>
        <img height="75" src="https://cdn.activepieces.com/pieces/${piece.name}.png" />
      </p>
    </Card>
      `
  });
  appsSnippet += "</CardGroup>";
  console.log('Overview is generated');
  fs.writeFileSync('./docs/_snippets/apps.mdx', appsSnippet);
}