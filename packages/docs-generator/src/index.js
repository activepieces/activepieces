"use strict";
exports.__esModule = true;
var pieces_1 = require("pieces");
var fs = require("fs");
var mintJson = JSON.parse(fs.readFileSync('../../../docs/mint.json', 'utf8'));
var appsDocsFolderPath = 'pieces/apps';
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
/** returns the mint.json path */
function writePieceDoc(p, mdxTemplate) {
    var docsFile = mdxTemplate.replace('TITLE', p.displayName);
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
    fs.writeFileSync("../../../docs/".concat(appsDocsFolderPath, "/").concat(p.metadata().name, ".mdx"), docsFile);
    return "".concat(appsDocsFolderPath, "/").concat(p.metadata().name);
}
var TEMPLATE_MDX = fs.readFileSync('template.mdx', 'utf8');
var appsDocsFilesPaths = [];
pieces_1.pieces.forEach(function (p) {
    var predefinedMdxPath = "../../pieces/src/apps/".concat(p.name, "/").concat(p.name, ".mdx");
    if (fs.existsSync(predefinedMdxPath)) {
        var predfinedMdxFile = fs.readFileSync(predefinedMdxPath, 'utf8');
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
var appsGroupIndex = mintJson.navigation.findIndex(function (n) { return n.group === 'Apps'; });
var appsGroup = { group: 'Apps', pages: appsDocsFilesPaths.sort() };
if (appsGroupIndex === -1) {
    mintJson.navigation.push(appsGroup);
}
else {
    mintJson.navigation[appsGroupIndex] = appsGroup;
}
fs.writeFileSync('../../../docs/mint.json', JSON.stringify(mintJson, null, 2));
console.log('docs generated');
