"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIErrorResponse = exports.CreateAIProviderRequest = exports.AIProviderModel = exports.AIProviderModelType = exports.AIProviderWithoutSensitiveData = exports.AIProvider = exports.AIProviderName = exports.AIProviderConfig = exports.OpenRouterProviderConfig = exports.OpenAIProviderConfig = exports.GoogleProviderConfig = exports.AzureProviderConfig = exports.AnthropicProviderConfig = void 0;
const typebox_1 = require("@sinclair/typebox");
const base_model_1 = require("../common/base-model");
exports.AnthropicProviderConfig = typebox_1.Type.Object({
    apiKey: typebox_1.Type.String(),
});
exports.AzureProviderConfig = typebox_1.Type.Object({
    apiKey: typebox_1.Type.String(),
    resourceName: typebox_1.Type.String(),
});
exports.GoogleProviderConfig = typebox_1.Type.Object({
    apiKey: typebox_1.Type.String(),
});
exports.OpenAIProviderConfig = typebox_1.Type.Object({
    apiKey: typebox_1.Type.String(),
});
exports.OpenRouterProviderConfig = typebox_1.Type.Object({
    apiKey: typebox_1.Type.String(),
});
exports.AIProviderConfig = typebox_1.Type.Union([
    exports.AnthropicProviderConfig,
    exports.AzureProviderConfig,
    exports.GoogleProviderConfig,
    exports.OpenAIProviderConfig,
    exports.OpenRouterProviderConfig,
]);
var AIProviderName;
(function (AIProviderName) {
    AIProviderName["OPENAI"] = "openai";
    AIProviderName["OPENROUTER"] = "openrouter";
    AIProviderName["ANTHROPIC"] = "anthropic";
    AIProviderName["AZURE"] = "azure";
    AIProviderName["GOOGLE"] = "google";
    AIProviderName["ACTIVEPIECES"] = "activepieces";
})(AIProviderName || (exports.AIProviderName = AIProviderName = {}));
const ProviderConfigUnion = (0, base_model_1.DiscriminatedUnion)('provider', [
    typebox_1.Type.Object({
        provider: typebox_1.Type.Literal(AIProviderName.OPENAI),
        config: exports.OpenAIProviderConfig,
    }),
    typebox_1.Type.Object({
        provider: typebox_1.Type.Literal(AIProviderName.OPENROUTER),
        config: exports.OpenRouterProviderConfig,
    }),
    typebox_1.Type.Object({
        provider: typebox_1.Type.Literal(AIProviderName.ANTHROPIC),
        config: exports.AnthropicProviderConfig,
    }),
    typebox_1.Type.Object({
        provider: typebox_1.Type.Literal(AIProviderName.AZURE),
        config: exports.AzureProviderConfig,
    }),
    typebox_1.Type.Object({
        provider: typebox_1.Type.Literal(AIProviderName.GOOGLE),
        config: exports.GoogleProviderConfig,
    }),
    typebox_1.Type.Object({
        provider: typebox_1.Type.Literal(AIProviderName.ACTIVEPIECES),
        config: exports.OpenRouterProviderConfig,
    }),
]);
exports.AIProvider = typebox_1.Type.Intersect([
    typebox_1.Type.Object(Object.assign({}, base_model_1.BaseModelSchema)),
    ProviderConfigUnion,
    typebox_1.Type.Object({
        displayName: typebox_1.Type.String({ minLength: 1 }),
        platformId: typebox_1.Type.String(),
    }),
]);
exports.AIProviderWithoutSensitiveData = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    name: typebox_1.Type.String(),
    configured: typebox_1.Type.Boolean(),
});
var AIProviderModelType;
(function (AIProviderModelType) {
    AIProviderModelType["IMAGE"] = "image";
    AIProviderModelType["TEXT"] = "text";
})(AIProviderModelType || (exports.AIProviderModelType = AIProviderModelType = {}));
exports.AIProviderModel = typebox_1.Type.Object({
    id: typebox_1.Type.String(),
    name: typebox_1.Type.String(),
    type: typebox_1.Type.Enum(AIProviderModelType),
});
exports.CreateAIProviderRequest = ProviderConfigUnion;
exports.AIErrorResponse = typebox_1.Type.Object({
    error: typebox_1.Type.Object({
        message: typebox_1.Type.String(),
        type: typebox_1.Type.String(),
        code: typebox_1.Type.String(),
    }),
});
//# sourceMappingURL=index.js.map