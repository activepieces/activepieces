import { pieces, Trigger } from 'pieces';
import { Action } from 'pieces/dist/framework/action/action';
import * as fs from 'fs';
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

const TEMPLATE_MDX = fs.readFileSync('template.mdx', 'utf8');
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

  console.log(triggerCards.length + ' ', actionsCards.length);
  docsFile = docsFile.replace('ACTIONS', actionsCards);
  docsFile = docsFile.replace('TRIGGERS', triggerCards);
  fs.writeFileSync(
    `../../../docs/pieces/apps/${p.metadata().name}.mdx`,
    docsFile
  );
});
