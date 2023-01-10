import { pieces, Trigger, Action } from 'pieces';

import * as fs from 'fs';
const mintJson: { navigation: { group: string; pages: string[] }[] } =
  JSON.parse(fs.readFileSync('../../../docs/mint.json', 'utf8'));
const appsFolderPath = 'pieces/apps';
const appsDocsFilesPaths: string[] = [];
const TEMPLATE_MDX = fs.readFileSync('template.mdx', 'utf8');

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

pieces.forEach((p) => {
  var docsFile = TEMPLATE_MDX.replace('TITLE', p.displayName);
  var actionsCards = getPieceCards(p.metadata().actions);
  if (!actionsCards) {
    actionsCards =
      '*No supported actions yet, please let us know if you need something on Discord so we can help out* \n';
  }
  var triggerCards = getPieceCards(p.metadata().triggers);
  if (!triggerCards) {
    triggerCards =
      '*No supported triggers yet, please let us know if you need something on Discord so we can help out* \n';
  }
  docsFile = docsFile.replace('ACTIONS', actionsCards);
  docsFile = docsFile.replace('TRIGGERS', triggerCards);
  fs.writeFileSync(
    `../../../docs/${appsFolderPath}/${p.metadata().name}.mdx`,
    docsFile
  );
  appsDocsFilesPaths.push(`${appsFolderPath}/${p.metadata().name}`);
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
fs.writeFileSync('../../../docs/mint.json', JSON.stringify(mintJson, null, 2));

console.log('docs generated');
