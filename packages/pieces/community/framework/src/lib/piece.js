"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPiece = exports.Piece = void 0;
const tslib_1 = require("tslib");
const versioning_1 = require("./context/versioning");
const semver = tslib_1.__importStar(require("semver"));
class Piece {
    constructor(displayName, logoUrl, authors, events, actions, triggers, categories, auth, minimumSupportedRelease = versioning_1.MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION, maximumSupportedRelease, description = '') {
        this.displayName = displayName;
        this.logoUrl = logoUrl;
        this.authors = authors;
        this.events = events;
        this.categories = categories;
        this.auth = auth;
        this.minimumSupportedRelease = minimumSupportedRelease;
        this.maximumSupportedRelease = maximumSupportedRelease;
        this.description = description;
        this._actions = {};
        this._triggers = {};
        // this method didn't exist in older version
        this.getContextInfo = () => ({ version: versioning_1.LATEST_CONTEXT_VERSION });
        if (!semver.valid(minimumSupportedRelease) || semver.lt(minimumSupportedRelease, versioning_1.MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION)) {
            this.minimumSupportedRelease = versioning_1.MINIMUM_SUPPORTED_RELEASE_AFTER_LATEST_CONTEXT_VERSION;
        }
        actions.forEach((action) => (this._actions[action.name] = action));
        triggers.forEach((trigger) => (this._triggers[trigger.name] = trigger));
    }
    metadata() {
        var _a;
        return {
            displayName: this.displayName,
            logoUrl: this.logoUrl,
            actions: this._actions,
            triggers: this._triggers,
            categories: this.categories,
            description: this.description,
            authors: this.authors,
            auth: this.auth,
            minimumSupportedRelease: this.minimumSupportedRelease,
            maximumSupportedRelease: this.maximumSupportedRelease,
            contextInfo: (_a = this.getContextInfo) === null || _a === void 0 ? void 0 : _a.call(this)
        };
    }
    getAction(actionName) {
        return this._actions[actionName];
    }
    getTrigger(triggerName) {
        return this._triggers[triggerName];
    }
    actions() {
        return this._actions;
    }
    triggers() {
        return this._triggers;
    }
}
exports.Piece = Piece;
const createPiece = (params) => {
    var _a, _b;
    if (params.auth && Array.isArray(params.auth)) {
        const isUnique = params.auth.every((auth, index, self) => index === self.findIndex((t) => t.type === auth.type));
        if (!isUnique) {
            throw new Error('Auth properties must be unique by type');
        }
    }
    return new Piece(params.displayName, params.logoUrl, (_a = params.authors) !== null && _a !== void 0 ? _a : [], params.events, params.actions, params.triggers, (_b = params.categories) !== null && _b !== void 0 ? _b : [], params.auth, params.minimumSupportedRelease, params.maximumSupportedRelease, params.description);
};
exports.createPiece = createPiece;
//# sourceMappingURL=piece.js.map