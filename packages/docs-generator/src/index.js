"use strict";
exports.__esModule = true;
var pieces_1 = require("pieces");
var fs = require("fs");
function getCardTemplate(title, description) {
    var CARD_TEMPLATE = "\n    <CardGroup cols={2}>\n      <Card title=\"".concat(title, "\">\n        ").concat(description, "\n      </Card>\n    </CardGroup>\n    ");
    return CARD_TEMPLATE;
}
function getPieceCards(items) {
    var itemsNames = Object.keys(items);
    var itemsCards = itemsNames
        .map(function (itemName) {
        var title = items[itemName].displayName;
        var description = items[itemName].description;
        return getCardTemplate(title, description);
    })
        .join('');
    return itemsCards;
}
var TEMPLATE_MDX = fs.readFileSync('template.mdx', 'utf8');
pieces_1.pieces.forEach(function (p) {
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
    fs.writeFileSync("../../../docs/pieces/apps/".concat(p.metadata().name, ".mdx"), docsFile);
});
