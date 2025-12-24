"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pieceTranslation = void 0;
const tslib_1 = require("tslib");
const shared_1 = require("@activepieces/shared");
const path_1 = tslib_1.__importDefault(require("path"));
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
exports.pieceTranslation = {
    translatePiece: (piece, locale) => {
        var _a;
        if (!locale) {
            return piece;
        }
        try {
            const target = (_a = piece.i18n) === null || _a === void 0 ? void 0 : _a[locale];
            if (!target) {
                return piece;
            }
            const translatedPiece = JSON.parse(JSON.stringify(piece));
            exports.pieceTranslation.pathsToValuesToTranslate.forEach(key => {
                translateProperty(translatedPiece, key, target);
            });
            return translatedPiece;
        }
        catch (err) {
            console.error(`error translating piece ${piece.name}:`, err);
            return piece;
        }
    },
    /**Gets the piece metadata regardles of piece location (node_modules or dist), wasn't included inside piece.metadata() for backwards compatibility issues (if an old ap version installs a new piece it would fail)*/
    initializeI18n: (pieceOutputPath) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        try {
            const locales = Object.values(shared_1.LocalesEnum);
            const i18n = {};
            for (const locale of locales) {
                const translations = yield readLocaleFile(locale, pieceOutputPath);
                if (translations) {
                    i18n[locale] = translations;
                }
            }
            return Object.keys(i18n).length > 0 ? i18n : undefined;
        }
        catch (err) {
            console.log(`Error initializing i18n for ${pieceOutputPath}:`, err);
            return undefined;
        }
    }),
    pathsToValuesToTranslate: [
        "description",
        "auth.username.displayName",
        "auth.username.description",
        "auth.password.displayName",
        "auth.password.description",
        "auth.props.*.displayName",
        "auth.props.*.description",
        "auth.props.*.options.options.*.label",
        "auth.description",
        "actions.*.displayName",
        "actions.*.description",
        "actions.*.props.*.displayName",
        "actions.*.props.*.description",
        "actions.*.props.*.options.options.*.label",
        "triggers.*.displayName",
        "triggers.*.description",
        "triggers.*.props.*.displayName",
        "triggers.*.props.*.description",
        "triggers.*.props.*.options.options.*.label"
    ]
};
/**This function translates a property inside a piece, i.e description, displayName, etc...
 *
 * @param pieceModelOrProperty - The piece model or property to translate
 * @param path - The path to the property to translate, i.e auth.username.displayName
 * @param i18n - The i18n object
 */
function translateProperty(pieceModelOrProperty, path, i18n) {
    const parsedKeys = path.split('.');
    if (parsedKeys[0] === '*') {
        return Object.values(pieceModelOrProperty).forEach(item => translateProperty(item, parsedKeys.slice(1).join('.'), i18n));
    }
    const nextObject = pieceModelOrProperty[parsedKeys[0]];
    if (!nextObject) {
        return;
    }
    if (parsedKeys.length > 1) {
        return translateProperty(nextObject, parsedKeys.slice(1).join('.'), i18n);
    }
    const propertyValue = pieceModelOrProperty[parsedKeys[0]];
    const valueInI18n = i18n[propertyValue.slice(0, shared_1.MAX_KEY_LENGTH_FOR_CORWDIN)];
    if (valueInI18n) {
        pieceModelOrProperty[parsedKeys[0]] = valueInI18n;
    }
}
function fileExists(filePath) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield promises_1.default.access(filePath);
            return true;
        }
        catch (_a) {
            return false;
        }
    });
}
const readLocaleFile = (locale, pieceOutputPath) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.join(pieceOutputPath, 'src', 'i18n', `${locale}.json`);
    if (!(yield fileExists(filePath))) {
        return null;
    }
    try {
        const fileContent = yield promises_1.default.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);
        if (typeof translations === 'object' && translations !== null) {
            return translations;
        }
        throw new Error(`Invalid i18n file format for ${locale} in piece ${pieceOutputPath}`);
    }
    catch (error) {
        console.error(`Error reading i18n file for ${locale} in piece ${pieceOutputPath}:`, error);
        return null;
    }
});
//# sourceMappingURL=i18n.js.map