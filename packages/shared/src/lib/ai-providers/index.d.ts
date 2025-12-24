import { Static } from '@sinclair/typebox';
export declare const AnthropicProviderConfig: import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>;
export type AnthropicProviderConfig = Static<typeof AnthropicProviderConfig>;
export declare const AzureProviderConfig: import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
    resourceName: import("@sinclair/typebox").TString;
}>;
export type AzureProviderConfig = Static<typeof AzureProviderConfig>;
export declare const GoogleProviderConfig: import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>;
export type GoogleProviderConfig = Static<typeof GoogleProviderConfig>;
export declare const OpenAIProviderConfig: import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>;
export type OpenAIProviderConfig = Static<typeof OpenAIProviderConfig>;
export declare const OpenRouterProviderConfig: import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>;
export type OpenRouterProviderConfig = Static<typeof OpenRouterProviderConfig>;
export declare const AIProviderConfig: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
    resourceName: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    apiKey: import("@sinclair/typebox").TString;
}>]>;
export type AIProviderConfig = Static<typeof AIProviderConfig>;
export declare enum AIProviderName {
    OPENAI = "openai",
    OPENROUTER = "openrouter",
    ANTHROPIC = "anthropic",
    AZURE = "azure",
    GOOGLE = "google",
    ACTIVEPIECES = "activepieces"
}
export declare const AIProvider: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>, import("../common/base-model").TDiscriminatedUnion<[import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.OPENAI>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.OPENROUTER>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.ANTHROPIC>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.AZURE>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
        resourceName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.GOOGLE>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.ACTIVEPIECES>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>]>, import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
}>]>;
export type AIProvider = Static<typeof AIProvider>;
export declare const AIProviderWithoutSensitiveData: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    configured: import("@sinclair/typebox").TBoolean;
}>;
export type AIProviderWithoutSensitiveData = Static<typeof AIProviderWithoutSensitiveData>;
export declare enum AIProviderModelType {
    IMAGE = "image",
    TEXT = "text"
}
export declare const AIProviderModel: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TEnum<typeof AIProviderModelType>;
}>;
export type AIProviderModel = Static<typeof AIProviderModel>;
export declare const CreateAIProviderRequest: import("../common/base-model").TDiscriminatedUnion<[import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.OPENAI>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.OPENROUTER>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.ANTHROPIC>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.AZURE>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
        resourceName: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.GOOGLE>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>, import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TLiteral<AIProviderName.ACTIVEPIECES>;
    config: import("@sinclair/typebox").TObject<{
        apiKey: import("@sinclair/typebox").TString;
    }>;
}>]>;
export type CreateAIProviderRequest = Static<typeof CreateAIProviderRequest>;
export declare const AIErrorResponse: import("@sinclair/typebox").TObject<{
    error: import("@sinclair/typebox").TObject<{
        message: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
    }>;
}>;
export type AIErrorResponse = Static<typeof AIErrorResponse>;
