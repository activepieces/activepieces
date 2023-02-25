import * as fs from 'node:fs';
import { Piece } from '@activepieces/framework';
import { pieces } from '..';
import { ActionBase } from '@activepieces/shared';

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

function getPieceCards(items: Record<string, ActionBase>) {
  const itemsCards: string[] = [];

  Object.values(items).forEach(item => {
    const card = getCardTemplate(item.displayName, item.description);
    itemsCards.push(card);
  })

  return itemsCards.join('');
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

const TEMPLATE_MDX = fs.readFileSync('packages/pieces/apps/src/docs-generator/template.mdx', 'utf8');
const appsDocsFilesPaths: string[] = [];
pieces.forEach((p) => {
  const predefinedMdxPath = `packages/pieces/apps/src/lib/${p.name}/${p.name}.mdx`;
  if (fs.existsSync(predefinedMdxPath)) {
    const predefinedMdxFile = fs.readFileSync(predefinedMdxPath, 'utf8');
    appsDocsFilesPaths.push(writePieceDoc(p, predefinedMdxFile));
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
  fs.writeFileSync('./docs/_snippets/apps.mdx', appsSnippet);
}
