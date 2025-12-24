"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrigger = exports.ITrigger = exports.WebhookRenewConfiguration = exports.WebhookRenewStrategy = exports.DEDUPE_KEY_PROPERTY = exports.TriggerStrategy = void 0;
const tslib_1 = require("tslib");
const typebox_1 = require("@sinclair/typebox");
const shared_1 = require("@activepieces/shared");
Object.defineProperty(exports, "TriggerStrategy", { enumerable: true, get: function () { return shared_1.TriggerStrategy; } });
exports.DEDUPE_KEY_PROPERTY = '_dedupe_key';
var WebhookRenewStrategy;
(function (WebhookRenewStrategy) {
    WebhookRenewStrategy["CRON"] = "CRON";
    WebhookRenewStrategy["NONE"] = "NONE";
})(WebhookRenewStrategy || (exports.WebhookRenewStrategy = WebhookRenewStrategy = {}));
exports.WebhookRenewConfiguration = typebox_1.Type.Union([
    typebox_1.Type.Object({
        strategy: typebox_1.Type.Literal(WebhookRenewStrategy.CRON),
        cronExpression: typebox_1.Type.String(),
    }),
    typebox_1.Type.Object({
        strategy: typebox_1.Type.Literal(WebhookRenewStrategy.NONE),
    }),
]);
class ITrigger {
    constructor(name, displayName, description, requireAuth, props, type, handshakeConfiguration, onHandshake, renewConfiguration, onRenew, onEnable, onDisable, onStart, run, test, sampleData, testStrategy) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.requireAuth = requireAuth;
        this.props = props;
        this.type = type;
        this.handshakeConfiguration = handshakeConfiguration;
        this.onHandshake = onHandshake;
        this.renewConfiguration = renewConfiguration;
        this.onRenew = onRenew;
        this.onEnable = onEnable;
        this.onDisable = onDisable;
        this.onStart = onStart;
        this.run = run;
        this.test = test;
        this.sampleData = sampleData;
        this.testStrategy = testStrategy;
    }
}
exports.ITrigger = ITrigger;
// TODO refactor and extract common logic
const createTrigger = (params) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    switch (params.type) {
        case shared_1.TriggerStrategy.WEBHOOK:
            return new ITrigger(params.name, params.displayName, params.description, (_a = params.requireAuth) !== null && _a !== void 0 ? _a : true, params.props, params.type, (_b = params.handshakeConfiguration) !== null && _b !== void 0 ? _b : { strategy: shared_1.WebhookHandshakeStrategy.NONE }, (_c = params.onHandshake) !== null && _c !== void 0 ? _c : (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return ({ status: 200 }); })), (_d = params.renewConfiguration) !== null && _d !== void 0 ? _d : { strategy: WebhookRenewStrategy.NONE }, (_e = params.onRenew) !== null && _e !== void 0 ? _e : (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return Promise.resolve(); })), params.onEnable, params.onDisable, (_f = params.onStart) !== null && _f !== void 0 ? _f : (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return Promise.resolve(); })), params.run, (_g = params.test) !== null && _g !== void 0 ? _g : (() => Promise.resolve([params.sampleData])), params.sampleData, params.test ? shared_1.TriggerTestStrategy.TEST_FUNCTION : shared_1.TriggerTestStrategy.SIMULATION);
        case shared_1.TriggerStrategy.POLLING:
            return new ITrigger(params.name, params.displayName, params.description, (_h = params.requireAuth) !== null && _h !== void 0 ? _h : true, params.props, params.type, { strategy: shared_1.WebhookHandshakeStrategy.NONE }, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return ({ status: 200 }); }), { strategy: WebhookRenewStrategy.NONE }, (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return Promise.resolve(); })), params.onEnable, params.onDisable, (_j = params.onStart) !== null && _j !== void 0 ? _j : (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return Promise.resolve(); })), params.run, (_k = params.test) !== null && _k !== void 0 ? _k : (() => Promise.resolve([params.sampleData])), params.sampleData, shared_1.TriggerTestStrategy.TEST_FUNCTION);
        case shared_1.TriggerStrategy.APP_WEBHOOK:
            return new ITrigger(params.name, params.displayName, params.description, (_l = params.requireAuth) !== null && _l !== void 0 ? _l : true, params.props, params.type, { strategy: shared_1.WebhookHandshakeStrategy.NONE }, () => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return ({ status: 200 }); }), { strategy: WebhookRenewStrategy.NONE }, (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return Promise.resolve(); })), params.onEnable, params.onDisable, (_m = params.onStart) !== null && _m !== void 0 ? _m : (() => tslib_1.__awaiter(void 0, void 0, void 0, function* () { return Promise.resolve(); })), params.run, (_o = params.test) !== null && _o !== void 0 ? _o : (() => Promise.resolve([params.sampleData])), params.sampleData, ((0, shared_1.isNil)(params.sampleData) && (0, shared_1.isNil)(params.test)) ? shared_1.TriggerTestStrategy.SIMULATION : shared_1.TriggerTestStrategy.TEST_FUNCTION);
    }
};
exports.createTrigger = createTrigger;
//# sourceMappingURL=trigger.js.map