"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_KEY_LENGTH_FOR_CORWDIN = exports.getPieceMajorAndMinorVersion = exports.extractPieceFromModule = exports.trimVersionFromAlias = exports.getPieceNameFromAlias = exports.getPackageAliasForPiece = void 0;
const tslib_1 = require("tslib");
const major_1 = tslib_1.__importDefault(require("semver/functions/major"));
const minor_1 = tslib_1.__importDefault(require("semver/functions/minor"));
const min_version_1 = tslib_1.__importDefault(require("semver/ranges/min-version"));
const common_1 = require("../common");
const activepieces_error_1 = require("../common/activepieces-error");
/**
 * @param {string} pieceName - starts with `@activepieces/piece-`
 * @param {string} pieceVersion - the version of the piece
 * @returns {string} the package alias for the piece, e.g. `@activepieces/piece-activepieces-0.0.1`
 */
const getPackageAliasForPiece = (params) => {
    const { pieceName, pieceVersion } = params;
    return `${pieceName}-${pieceVersion}`;
};
exports.getPackageAliasForPiece = getPackageAliasForPiece;
/**
 * @param {string} alias - e.g. piece-activepieces or @publisher/piece-activepieces or activepieces or @publisher/activepieces
 * @returns {string} the piece name, e.g. activepieces
 */
const getPieceNameFromAlias = (alias) => {
    const fullPieceName = alias.startsWith('@') ? alias.split('/').pop() : alias;
    (0, common_1.assertNotNullOrUndefined)(fullPieceName, 'Full piece name');
    if (fullPieceName.startsWith('piece-')) {
        return fullPieceName.split('-').slice(1).join('-');
    }
    return fullPieceName;
};
exports.getPieceNameFromAlias = getPieceNameFromAlias;
/**
 * @param {string} alias - e.g. `@activepieces/piece-activepieces-0.0.1`
 * @returns {string} the piece name, e.g. `@activepieces/piece-activepieces`
 */
const trimVersionFromAlias = (alias) => {
    return alias.split('-').slice(0, -1).join('-');
};
exports.trimVersionFromAlias = trimVersionFromAlias;
const extractPieceFromModule = (params) => {
    var _a;
    const { module, pieceName, pieceVersion } = params;
    const exports = Object.values(module);
    const constructors = [];
    for (const e of exports) {
        if (e !== null && e !== undefined && e.constructor.name === 'Piece') {
            return e;
        }
        constructors.push((_a = e === null || e === void 0 ? void 0 : e.constructor) === null || _a === void 0 ? void 0 : _a.name);
    }
    throw new activepieces_error_1.ActivepiecesError({
        code: activepieces_error_1.ErrorCode.PIECE_NOT_FOUND,
        params: {
            pieceName,
            pieceVersion,
            message: `Failed to extract piece from module, found constructors: ${constructors.join(', ')}`,
        },
    });
};
exports.extractPieceFromModule = extractPieceFromModule;
const getPieceMajorAndMinorVersion = (pieceVersion) => {
    const minimumSemver = (0, min_version_1.default)(pieceVersion);
    return minimumSemver
        ? `${(0, major_1.default)(minimumSemver)}.${(0, minor_1.default)(minimumSemver)}`
        : `${(0, major_1.default)(pieceVersion)}.${(0, minor_1.default)(pieceVersion)}`;
};
exports.getPieceMajorAndMinorVersion = getPieceMajorAndMinorVersion;
exports.MAX_KEY_LENGTH_FOR_CORWDIN = 512;
//# sourceMappingURL=utils.js.map