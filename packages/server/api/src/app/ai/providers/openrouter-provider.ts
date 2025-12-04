import { ActivepiecesError, ErrorCode } from '@activepieces/shared';
import { AIProviderStrategy, ProviderModel } from './ai-provider';

const openRouterModels: ProviderModel[] = [
    {
        id: 'amazon/nova-2-lite-v1:free',
        name: 'Amazon: Nova 2 Lite (free)',
        type: 'text',
    },
    {
        id: 'amazon/nova-2-lite-v1',
        name: 'Amazon: Nova 2 Lite',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-large-2512',
        name: 'Mistral: Mistral Large 3 2512',
        type: 'text',
    },
    {
        id: 'arcee-ai/trinity-mini:free',
        name: 'Arcee AI: Trinity Mini (free)',
        type: 'text',
    },
    {
        id: 'arcee-ai/trinity-mini',
        name: 'Arcee AI: Trinity Mini',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-v3.2-speciale',
        name: 'DeepSeek: DeepSeek V3.2 Speciale',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-v3.2',
        name: 'DeepSeek: DeepSeek V3.2',
        type: 'text',
    },
    {
        id: 'prime-intellect/intellect-3',
        name: 'Prime Intellect: INTELLECT-3',
        type: 'text',
    },
    {
        id: 'tngtech/tng-r1t-chimera:free',
        name: 'TNG: R1T Chimera (free)',
        type: 'text',
    },
    {
        id: 'tngtech/tng-r1t-chimera',
        name: 'TNG: R1T Chimera',
        type: 'text',
    },
    {
        id: 'anthropic/claude-opus-4.5',
        name: 'Anthropic: Claude Opus 4.5',
        type: 'text',
    },
    {
        id: 'allenai/olmo-3-32b-think:free',
        name: 'AllenAI: Olmo 3 32B Think (free)',
        type: 'text',
    },
    {
        id: 'allenai/olmo-3-7b-instruct',
        name: 'AllenAI: Olmo 3 7B Instruct',
        type: 'text',
    },
    {
        id: 'allenai/olmo-3-7b-think',
        name: 'AllenAI: Olmo 3 7B Think',
        type: 'text',
    },
    {
        id: 'google/gemini-3-pro-image-preview',
        name: 'Google: Nano Banana Pro (Gemini 3 Pro Image Preview)',
        type: 'text',
    },
    {
        id: 'x-ai/grok-4.1-fast:free',
        name: 'xAI: Grok 4.1 Fast (free)',
        type: 'text',
    },
    {
        id: 'google/gemini-3-pro-preview',
        name: 'Google: Gemini 3 Pro Preview',
        type: 'text',
    },
    {
        id: 'deepcogito/cogito-v2.1-671b',
        name: 'Deep Cogito: Cogito v2.1 671B',
        type: 'text',
    },
    {
        id: 'openai/gpt-5.1',
        name: 'OpenAI: GPT-5.1',
        type: 'text',
    },
    {
        id: 'openai/gpt-5.1-chat',
        name: 'OpenAI: GPT-5.1 Chat',
        type: 'text',
    },
    {
        id: 'openai/gpt-5.1-codex',
        name: 'OpenAI: GPT-5.1-Codex',
        type: 'text',
    },
    {
        id: 'openai/gpt-5.1-codex-mini',
        name: 'OpenAI: GPT-5.1-Codex-Mini',
        type: 'text',
    },
    {
        id: 'kwaipilot/kat-coder-pro:free',
        name: 'Kwaipilot: KAT-Coder-Pro V1 (free)',
        type: 'text',
    },
    {
        id: 'moonshotai/kimi-linear-48b-a3b-instruct',
        name: 'MoonshotAI: Kimi Linear 48B A3B Instruct',
        type: 'text',
    },
    {
        id: 'moonshotai/kimi-k2-thinking',
        name: 'MoonshotAI: Kimi K2 Thinking',
        type: 'text',
    },
    {
        id: 'amazon/nova-premier-v1',
        name: 'Amazon: Nova Premier 1.0',
        type: 'text',
    },
    {
        id: 'perplexity/sonar-pro-search',
        name: 'Perplexity: Sonar Pro Search',
        type: 'text',
    },
    {
        id: 'mistralai/voxtral-small-24b-2507',
        name: 'Mistral: Voxtral Small 24B 2507',
        type: 'text',
    },
    {
        id: 'openai/gpt-oss-safeguard-20b',
        name: 'OpenAI: gpt-oss-safeguard-20b',
        type: 'text',
    },
    {
        id: 'nvidia/nemotron-nano-12b-v2-vl:free',
        name: 'NVIDIA: Nemotron Nano 12B 2 VL (free)',
        type: 'text',
    },
    {
        id: 'nvidia/nemotron-nano-12b-v2-vl',
        name: 'NVIDIA: Nemotron Nano 12B 2 VL',
        type: 'text',
    },
    {
        id: 'minimax/minimax-m2',
        name: 'MiniMax: MiniMax M2',
        type: 'text',
    },
    {
        id: 'liquid/lfm2-8b-a1b',
        name: 'LiquidAI/LFM2-8B-A1B',
        type: 'text',
    },
    {
        id: 'liquid/lfm-2.2-6b',
        name: 'LiquidAI/LFM2-2.6B',
        type: 'text',
    },
    {
        id: 'ibm-granite/granite-4.0-h-micro',
        name: 'IBM: Granite 4.0 Micro',
        type: 'text',
    },
    {
        id: 'deepcogito/cogito-v2-preview-llama-405b',
        name: 'Deep Cogito: Cogito V2 Preview Llama 405B',
        type: 'text',
    },
    {
        id: 'openai/gpt-5-image-mini',
        name: 'OpenAI: GPT-5 Image Mini',
        type: 'text',
    },
    {
        id: 'anthropic/claude-haiku-4.5',
        name: 'Anthropic: Claude Haiku 4.5',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-vl-8b-thinking',
        name: 'Qwen: Qwen3 VL 8B Thinking',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-vl-8b-instruct',
        name: 'Qwen: Qwen3 VL 8B Instruct',
        type: 'text',
    },
    {
        id: 'openai/gpt-5-image',
        name: 'OpenAI: GPT-5 Image',
        type: 'text',
    },
    {
        id: 'openai/o3-deep-research',
        name: 'OpenAI: o3 Deep Research',
        type: 'text',
    },
    {
        id: 'openai/o4-mini-deep-research',
        name: 'OpenAI: o4 Mini Deep Research',
        type: 'text',
    },
    {
        id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
        name: 'NVIDIA: Llama 3.3 Nemotron Super 49B V1.5',
        type: 'text',
    },
    {
        id: 'baidu/ernie-4.5-21b-a3b-thinking',
        name: 'Baidu: ERNIE 4.5 21B A3B Thinking',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-flash-image',
        name: 'Google: Gemini 2.5 Flash Image (Nano Banana)',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-vl-30b-a3b-thinking',
        name: 'Qwen: Qwen3 VL 30B A3B Thinking',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-vl-30b-a3b-instruct',
        name: 'Qwen: Qwen3 VL 30B A3B Instruct',
        type: 'text',
    },
    {
        id: 'openai/gpt-5-pro',
        name: 'OpenAI: GPT-5 Pro',
        type: 'text',
    },
    {
        id: 'z-ai/glm-4.6',
        name: 'Z.AI: GLM 4.6',
        type: 'text',
    },
    {
        id: 'z-ai/glm-4.6:exacto',
        name: 'Z.AI: GLM 4.6 (exacto)',
        type: 'text',
    },
    {
        id: 'anthropic/claude-sonnet-4.5',
        name: 'Anthropic: Claude Sonnet 4.5',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-v3.2-exp',
        name: 'DeepSeek: DeepSeek V3.2 Exp',
        type: 'text',
    },
    {
        id: 'thedrummer/cydonia-24b-v4.1',
        name: 'TheDrummer: Cydonia 24B V4.1',
        type: 'text',
    },
    {
        id: 'relace/relace-apply-3',
        name: 'Relace: Relace Apply 3',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-flash-preview-09-2025',
        name: 'Google: Gemini 2.5 Flash Preview 09-2025',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-flash-lite-preview-09-2025',
        name: 'Google: Gemini 2.5 Flash Lite Preview 09-2025',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-vl-235b-a22b-thinking',
        name: 'Qwen: Qwen3 VL 235B A22B Thinking',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-vl-235b-a22b-instruct',
        name: 'Qwen: Qwen3 VL 235B A22B Instruct',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-max',
        name: 'Qwen: Qwen3 Max',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-coder-plus',
        name: 'Qwen: Qwen3 Coder Plus',
        type: 'text',
    },
    {
        id: 'openai/gpt-5-codex',
        name: 'OpenAI: GPT-5 Codex',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-v3.1-terminus:exacto',
        name: 'DeepSeek: DeepSeek V3.1 Terminus (exacto)',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-v3.1-terminus',
        name: 'DeepSeek: DeepSeek V3.1 Terminus',
        type: 'text',
    },
    {
        id: 'x-ai/grok-4-fast',
        name: 'xAI: Grok 4 Fast',
        type: 'text',
    },
    {
        id: 'alibaba/tongyi-deepresearch-30b-a3b:free',
        name: 'Tongyi DeepResearch 30B A3B (free)',
        type: 'text',
    },
    {
        id: 'alibaba/tongyi-deepresearch-30b-a3b',
        name: 'Tongyi DeepResearch 30B A3B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-coder-flash',
        name: 'Qwen: Qwen3 Coder Flash',
        type: 'text',
    },
    {
        id: 'opengvlab/internvl3-78b',
        name: 'OpenGVLab: InternVL3 78B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-next-80b-a3b-thinking',
        name: 'Qwen: Qwen3 Next 80B A3B Thinking',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-next-80b-a3b-instruct',
        name: 'Qwen: Qwen3 Next 80B A3B Instruct',
        type: 'text',
    },
    {
        id: 'meituan/longcat-flash-chat:free',
        name: 'Meituan: LongCat Flash Chat (free)',
        type: 'text',
    },
    {
        id: 'meituan/longcat-flash-chat',
        name: 'Meituan: LongCat Flash Chat',
        type: 'text',
    },
    {
        id: 'qwen/qwen-plus-2025-07-28',
        name: 'Qwen: Qwen Plus 0728',
        type: 'text',
    },
    {
        id: 'qwen/qwen-plus-2025-07-28:thinking',
        name: 'Qwen: Qwen Plus 0728 (thinking)',
        type: 'text',
    },
    {
        id: 'nvidia/nemotron-nano-9b-v2:free',
        name: 'NVIDIA: Nemotron Nano 9B V2 (free)',
        type: 'text',
    },
    {
        id: 'nvidia/nemotron-nano-9b-v2',
        name: 'NVIDIA: Nemotron Nano 9B V2',
        type: 'text',
    },
    {
        id: 'moonshotai/kimi-k2-0905',
        name: 'MoonshotAI: Kimi K2 0905',
        type: 'text',
    },
    {
        id: 'moonshotai/kimi-k2-0905:exacto',
        name: 'MoonshotAI: Kimi K2 0905 (exacto)',
        type: 'text',
    },
    {
        id: 'deepcogito/cogito-v2-preview-llama-70b',
        name: 'Deep Cogito: Cogito V2 Preview Llama 70B',
        type: 'text',
    },
    {
        id: 'deepcogito/cogito-v2-preview-llama-109b-moe',
        name: 'Cogito V2 Preview Llama 109B',
        type: 'text',
    },
    {
        id: 'deepcogito/cogito-v2-preview-deepseek-671b',
        name: 'Deep Cogito: Cogito V2 Preview Deepseek 671B',
        type: 'text',
    },
    {
        id: 'stepfun-ai/step3',
        name: 'StepFun: Step3',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-30b-a3b-thinking-2507',
        name: 'Qwen: Qwen3 30B A3B Thinking 2507',
        type: 'text',
    },
    {
        id: 'x-ai/grok-code-fast-1',
        name: 'xAI: Grok Code Fast 1',
        type: 'text',
    },
    {
        id: 'nousresearch/hermes-4-70b',
        name: 'Nous: Hermes 4 70B',
        type: 'text',
    },
    {
        id: 'nousresearch/hermes-4-405b',
        name: 'Nous: Hermes 4 405B',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-flash-image-preview',
        name: 'Google: Gemini 2.5 Flash Image Preview (Nano Banana)',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-chat-v3.1',
        name: 'DeepSeek: DeepSeek V3.1',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-audio-preview',
        name: 'OpenAI: GPT-4o Audio',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-medium-3.1',
        name: 'Mistral: Mistral Medium 3.1',
        type: 'text',
    },
    {
        id: 'baidu/ernie-4.5-21b-a3b',
        name: 'Baidu: ERNIE 4.5 21B A3B',
        type: 'text',
    },
    {
        id: 'baidu/ernie-4.5-vl-28b-a3b',
        name: 'Baidu: ERNIE 4.5 VL 28B A3B',
        type: 'text',
    },
    {
        id: 'z-ai/glm-4.5v',
        name: 'Z.AI: GLM 4.5V',
        type: 'text',
    },
    {
        id: 'ai21/jamba-mini-1.7',
        name: 'AI21: Jamba Mini 1.7',
        type: 'text',
    },
    {
        id: 'ai21/jamba-large-1.7',
        name: 'AI21: Jamba Large 1.7',
        type: 'text',
    },
    {
        id: 'openai/gpt-5-chat',
        name: 'OpenAI: GPT-5 Chat',
        type: 'text',
    },
    {
        id: 'openai/gpt-5',
        name: 'OpenAI: GPT-5',
        type: 'text',
    },
    {
        id: 'openai/gpt-5-mini',
        name: 'OpenAI: GPT-5 Mini',
        type: 'text',
    },
    {
        id: 'openai/gpt-5-nano',
        name: 'OpenAI: GPT-5 Nano',
        type: 'text',
    },
    {
        id: 'openai/gpt-oss-120b:exacto',
        name: 'OpenAI: gpt-oss-120b (exacto)',
        type: 'text',
    },
    {
        id: 'openai/gpt-oss-120b',
        name: 'OpenAI: gpt-oss-120b',
        type: 'text',
    },
    {
        id: 'openai/gpt-oss-20b:free',
        name: 'OpenAI: gpt-oss-20b (free)',
        type: 'text',
    },
    {
        id: 'openai/gpt-oss-20b',
        name: 'OpenAI: gpt-oss-20b',
        type: 'text',
    },
    {
        id: 'anthropic/claude-opus-4.1',
        name: 'Anthropic: Claude Opus 4.1',
        type: 'text',
    },
    {
        id: 'mistralai/codestral-2508',
        name: 'Mistral: Codestral 2508',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-coder-30b-a3b-instruct',
        name: 'Qwen: Qwen3 Coder 30B A3B Instruct',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-30b-a3b-instruct-2507',
        name: 'Qwen: Qwen3 30B A3B Instruct 2507',
        type: 'text',
    },
    {
        id: 'z-ai/glm-4.5',
        name: 'Z.AI: GLM 4.5',
        type: 'text',
    },
    {
        id: 'z-ai/glm-4.5-air:free',
        name: 'Z.AI: GLM 4.5 Air (free)',
        type: 'text',
    },
    {
        id: 'z-ai/glm-4.5-air',
        name: 'Z.AI: GLM 4.5 Air',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-235b-a22b-thinking-2507',
        name: 'Qwen: Qwen3 235B A22B Thinking 2507',
        type: 'text',
    },
    {
        id: 'z-ai/glm-4-32b',
        name: 'Z.AI: GLM 4 32B ',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-coder:free',
        name: 'Qwen: Qwen3 Coder 480B A35B (free)',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-coder',
        name: 'Qwen: Qwen3 Coder 480B A35B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-coder:exacto',
        name: 'Qwen: Qwen3 Coder 480B A35B (exacto)',
        type: 'text',
    },
    {
        id: 'bytedance/ui-tars-1.5-7b',
        name: 'ByteDance: UI-TARS 7B ',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-flash-lite',
        name: 'Google: Gemini 2.5 Flash Lite',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-235b-a22b-2507',
        name: 'Qwen: Qwen3 235B A22B Instruct 2507',
        type: 'text',
    },
    {
        id: 'switchpoint/router',
        name: 'Switchpoint Router',
        type: 'text',
    },
    {
        id: 'moonshotai/kimi-k2:free',
        name: 'MoonshotAI: Kimi K2 0711 (free)',
        type: 'text',
    },
    {
        id: 'moonshotai/kimi-k2',
        name: 'MoonshotAI: Kimi K2 0711',
        type: 'text',
    },
    {
        id: 'thudm/glm-4.1v-9b-thinking',
        name: 'THUDM: GLM 4.1V 9B Thinking',
        type: 'text',
    },
    {
        id: 'mistralai/devstral-medium',
        name: 'Mistral: Devstral Medium',
        type: 'text',
    },
    {
        id: 'mistralai/devstral-small',
        name: 'Mistral: Devstral Small 1.1',
        type: 'text',
    },
    {
        id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
        name: 'Venice: Uncensored (free)',
        type: 'text',
    },
    {
        id: 'x-ai/grok-4',
        name: 'xAI: Grok 4',
        type: 'text',
    },
    {
        id: 'google/gemma-3n-e2b-it:free',
        name: 'Google: Gemma 3n 2B (free)',
        type: 'text',
    },
    {
        id: 'tencent/hunyuan-a13b-instruct',
        name: 'Tencent: Hunyuan A13B Instruct',
        type: 'text',
    },
    {
        id: 'tngtech/deepseek-r1t2-chimera:free',
        name: 'TNG: DeepSeek R1T2 Chimera (free)',
        type: 'text',
    },
    {
        id: 'tngtech/deepseek-r1t2-chimera',
        name: 'TNG: DeepSeek R1T2 Chimera',
        type: 'text',
    },
    {
        id: 'morph/morph-v3-large',
        name: 'Morph: Morph V3 Large',
        type: 'text',
    },
    {
        id: 'morph/morph-v3-fast',
        name: 'Morph: Morph V3 Fast',
        type: 'text',
    },
    {
        id: 'baidu/ernie-4.5-vl-424b-a47b',
        name: 'Baidu: ERNIE 4.5 VL 424B A47B ',
        type: 'text',
    },
    {
        id: 'baidu/ernie-4.5-300b-a47b',
        name: 'Baidu: ERNIE 4.5 300B A47B ',
        type: 'text',
    },
    {
        id: 'thedrummer/anubis-70b-v1.1',
        name: 'TheDrummer: Anubis 70B V1.1',
        type: 'text',
    },
    {
        id: 'inception/mercury',
        name: 'Inception: Mercury',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-small-3.2-24b-instruct',
        name: 'Mistral: Mistral Small 3.2 24B',
        type: 'text',
    },
    {
        id: 'minimax/minimax-m1',
        name: 'MiniMax: MiniMax M1',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-flash',
        name: 'Google: Gemini 2.5 Flash',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-pro',
        name: 'Google: Gemini 2.5 Pro',
        type: 'text',
    },
    {
        id: 'moonshotai/kimi-dev-72b',
        name: 'MoonshotAI: Kimi Dev 72B',
        type: 'text',
    },
    {
        id: 'openai/o3-pro',
        name: 'OpenAI: o3 Pro',
        type: 'text',
    },
    {
        id: 'x-ai/grok-3-mini',
        name: 'xAI: Grok 3 Mini',
        type: 'text',
    },
    {
        id: 'x-ai/grok-3',
        name: 'xAI: Grok 3',
        type: 'text',
    },
    {
        id: 'mistralai/magistral-small-2506',
        name: 'Mistral: Magistral Small 2506',
        type: 'text',
    },
    {
        id: 'mistralai/magistral-medium-2506:thinking',
        name: 'Mistral: Magistral Medium 2506 (thinking)',
        type: 'text',
    },
    {
        id: 'mistralai/magistral-medium-2506',
        name: 'Mistral: Magistral Medium 2506',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-pro-preview',
        name: 'Google: Gemini 2.5 Pro Preview 06-05',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-r1-0528-qwen3-8b',
        name: 'DeepSeek: DeepSeek R1 0528 Qwen3 8B',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-r1-0528',
        name: 'DeepSeek: R1 0528',
        type: 'text',
    },
    {
        id: 'anthropic/claude-opus-4',
        name: 'Anthropic: Claude Opus 4',
        type: 'text',
    },
    {
        id: 'anthropic/claude-sonnet-4',
        name: 'Anthropic: Claude Sonnet 4',
        type: 'text',
    },
    {
        id: 'mistralai/devstral-small-2505',
        name: 'Mistral: Devstral Small 2505',
        type: 'text',
    },
    {
        id: 'google/gemma-3n-e4b-it:free',
        name: 'Google: Gemma 3n 4B (free)',
        type: 'text',
    },
    {
        id: 'google/gemma-3n-e4b-it',
        name: 'Google: Gemma 3n 4B',
        type: 'text',
    },
    {
        id: 'openai/codex-mini',
        name: 'OpenAI: Codex Mini',
        type: 'text',
    },
    {
        id: 'nousresearch/deephermes-3-mistral-24b-preview',
        name: 'Nous: DeepHermes 3 Mistral 24B Preview',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-medium-3',
        name: 'Mistral: Mistral Medium 3',
        type: 'text',
    },
    {
        id: 'google/gemini-2.5-pro-preview-05-06',
        name: 'Google: Gemini 2.5 Pro Preview 05-06',
        type: 'text',
    },
    {
        id: 'arcee-ai/spotlight',
        name: 'Arcee AI: Spotlight',
        type: 'text',
    },
    {
        id: 'arcee-ai/maestro-reasoning',
        name: 'Arcee AI: Maestro Reasoning',
        type: 'text',
    },
    {
        id: 'arcee-ai/virtuoso-large',
        name: 'Arcee AI: Virtuoso Large',
        type: 'text',
    },
    {
        id: 'arcee-ai/coder-large',
        name: 'Arcee AI: Coder Large',
        type: 'text',
    },
    {
        id: 'microsoft/phi-4-reasoning-plus',
        name: 'Microsoft: Phi 4 Reasoning Plus',
        type: 'text',
    },
    {
        id: 'inception/mercury-coder',
        name: 'Inception: Mercury Coder',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-4b:free',
        name: 'Qwen: Qwen3 4B (free)',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-prover-v2',
        name: 'DeepSeek: DeepSeek Prover V2',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-guard-4-12b',
        name: 'Meta: Llama Guard 4 12B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-30b-a3b',
        name: 'Qwen: Qwen3 30B A3B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-8b',
        name: 'Qwen: Qwen3 8B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-14b',
        name: 'Qwen: Qwen3 14B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-32b',
        name: 'Qwen: Qwen3 32B',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-235b-a22b:free',
        name: 'Qwen: Qwen3 235B A22B (free)',
        type: 'text',
    },
    {
        id: 'qwen/qwen3-235b-a22b',
        name: 'Qwen: Qwen3 235B A22B',
        type: 'text',
    },
    {
        id: 'tngtech/deepseek-r1t-chimera:free',
        name: 'TNG: DeepSeek R1T Chimera (free)',
        type: 'text',
    },
    {
        id: 'tngtech/deepseek-r1t-chimera',
        name: 'TNG: DeepSeek R1T Chimera',
        type: 'text',
    },
    {
        id: 'microsoft/mai-ds-r1',
        name: 'Microsoft: MAI DS R1',
        type: 'text',
    },
    {
        id: 'openai/o4-mini-high',
        name: 'OpenAI: o4 Mini High',
        type: 'text',
    },
    {
        id: 'openai/o3',
        name: 'OpenAI: o3',
        type: 'text',
    },
    {
        id: 'openai/o4-mini',
        name: 'OpenAI: o4 Mini',
        type: 'text',
    },
    {
        id: 'qwen/qwen2.5-coder-7b-instruct',
        name: 'Qwen: Qwen2.5 Coder 7B Instruct',
        type: 'text',
    },
    {
        id: 'openai/gpt-4.1',
        name: 'OpenAI: GPT-4.1',
        type: 'text',
    },
    {
        id: 'openai/gpt-4.1-mini',
        name: 'OpenAI: GPT-4.1 Mini',
        type: 'text',
    },
    {
        id: 'openai/gpt-4.1-nano',
        name: 'OpenAI: GPT-4.1 Nano',
        type: 'text',
    },
    {
        id: 'eleutherai/llemma_7b',
        name: 'EleutherAI: Llemma 7b',
        type: 'text',
    },
    {
        id: 'alfredpros/codellama-7b-instruct-solidity',
        name: 'AlfredPros: CodeLLaMa 7B Instruct Solidity',
        type: 'text',
    },
    {
        id: 'arliai/qwq-32b-arliai-rpr-v1',
        name: 'ArliAI: QwQ 32B RpR v1',
        type: 'text',
    },
    {
        id: 'x-ai/grok-3-mini-beta',
        name: 'xAI: Grok 3 Mini Beta',
        type: 'text',
    },
    {
        id: 'x-ai/grok-3-beta',
        name: 'xAI: Grok 3 Beta',
        type: 'text',
    },
    {
        id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
        name: 'NVIDIA: Llama 3.1 Nemotron Ultra 253B v1',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-4-maverick',
        name: 'Meta: Llama 4 Maverick',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-4-scout',
        name: 'Meta: Llama 4 Scout',
        type: 'text',
    },
    {
        id: 'qwen/qwen2.5-vl-32b-instruct',
        name: 'Qwen: Qwen2.5 VL 32B Instruct',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-chat-v3-0324',
        name: 'DeepSeek: DeepSeek V3 0324',
        type: 'text',
    },
    {
        id: 'openai/o1-pro',
        name: 'OpenAI: o1-pro',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-small-3.1-24b-instruct:free',
        name: 'Mistral: Mistral Small 3.1 24B (free)',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-small-3.1-24b-instruct',
        name: 'Mistral: Mistral Small 3.1 24B',
        type: 'text',
    },
    {
        id: 'allenai/olmo-2-0325-32b-instruct',
        name: 'AllenAI: Olmo 2 32B Instruct',
        type: 'text',
    },
    {
        id: 'google/gemma-3-4b-it:free',
        name: 'Google: Gemma 3 4B (free)',
        type: 'text',
    },
    {
        id: 'google/gemma-3-4b-it',
        name: 'Google: Gemma 3 4B',
        type: 'text',
    },
    {
        id: 'google/gemma-3-12b-it:free',
        name: 'Google: Gemma 3 12B (free)',
        type: 'text',
    },
    {
        id: 'google/gemma-3-12b-it',
        name: 'Google: Gemma 3 12B',
        type: 'text',
    },
    {
        id: 'cohere/command-a',
        name: 'Cohere: Command A',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-mini-search-preview',
        name: 'OpenAI: GPT-4o-mini Search Preview',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-search-preview',
        name: 'OpenAI: GPT-4o Search Preview',
        type: 'text',
    },
    {
        id: 'google/gemma-3-27b-it:free',
        name: 'Google: Gemma 3 27B (free)',
        type: 'text',
    },
    {
        id: 'google/gemma-3-27b-it',
        name: 'Google: Gemma 3 27B',
        type: 'text',
    },
    {
        id: 'thedrummer/skyfall-36b-v2',
        name: 'TheDrummer: Skyfall 36B V2',
        type: 'text',
    },
    {
        id: 'microsoft/phi-4-multimodal-instruct',
        name: 'Microsoft: Phi 4 Multimodal Instruct',
        type: 'text',
    },
    {
        id: 'perplexity/sonar-reasoning-pro',
        name: 'Perplexity: Sonar Reasoning Pro',
        type: 'text',
    },
    {
        id: 'perplexity/sonar-pro',
        name: 'Perplexity: Sonar Pro',
        type: 'text',
    },
    {
        id: 'perplexity/sonar-deep-research',
        name: 'Perplexity: Sonar Deep Research',
        type: 'text',
    },
    {
        id: 'qwen/qwq-32b',
        name: 'Qwen: QwQ 32B',
        type: 'text',
    },
    {
        id: 'google/gemini-2.0-flash-lite-001',
        name: 'Google: Gemini 2.0 Flash Lite',
        type: 'text',
    },
    {
        id: 'anthropic/claude-3.7-sonnet:thinking',
        name: 'Anthropic: Claude 3.7 Sonnet (thinking)',
        type: 'text',
    },
    {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Anthropic: Claude 3.7 Sonnet',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-saba',
        name: 'Mistral: Saba',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-guard-3-8b',
        name: 'Llama Guard 3 8B',
        type: 'text',
    },
    {
        id: 'openai/o3-mini-high',
        name: 'OpenAI: o3 Mini High',
        type: 'text',
    },
    {
        id: 'google/gemini-2.0-flash-001',
        name: 'Google: Gemini 2.0 Flash',
        type: 'text',
    },
    {
        id: 'qwen/qwen-vl-plus',
        name: 'Qwen: Qwen VL Plus',
        type: 'text',
    },
    {
        id: 'aion-labs/aion-1.0',
        name: 'AionLabs: Aion-1.0',
        type: 'text',
    },
    {
        id: 'aion-labs/aion-1.0-mini',
        name: 'AionLabs: Aion-1.0-Mini',
        type: 'text',
    },
    {
        id: 'aion-labs/aion-rp-llama-3.1-8b',
        name: 'AionLabs: Aion-RP 1.0 (8B)',
        type: 'text',
    },
    {
        id: 'qwen/qwen-vl-max',
        name: 'Qwen: Qwen VL Max',
        type: 'text',
    },
    {
        id: 'qwen/qwen-turbo',
        name: 'Qwen: Qwen-Turbo',
        type: 'text',
    },
    {
        id: 'qwen/qwen2.5-vl-72b-instruct',
        name: 'Qwen: Qwen2.5 VL 72B Instruct',
        type: 'text',
    },
    {
        id: 'qwen/qwen-plus',
        name: 'Qwen: Qwen-Plus',
        type: 'text',
    },
    {
        id: 'qwen/qwen-max',
        name: 'Qwen: Qwen-Max ',
        type: 'text',
    },
    {
        id: 'openai/o3-mini',
        name: 'OpenAI: o3 Mini',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-small-24b-instruct-2501',
        name: 'Mistral: Mistral Small 3',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-r1-distill-qwen-32b',
        name: 'DeepSeek: R1 Distill Qwen 32B',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-r1-distill-qwen-14b',
        name: 'DeepSeek: R1 Distill Qwen 14B',
        type: 'text',
    },
    {
        id: 'perplexity/sonar-reasoning',
        name: 'Perplexity: Sonar Reasoning',
        type: 'text',
    },
    {
        id: 'perplexity/sonar',
        name: 'Perplexity: Sonar',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-r1-distill-llama-70b',
        name: 'DeepSeek: R1 Distill Llama 70B',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-r1',
        name: 'DeepSeek: R1',
        type: 'text',
    },
    {
        id: 'minimax/minimax-01',
        name: 'MiniMax: MiniMax-01',
        type: 'text',
    },
    {
        id: 'mistralai/codestral-2501',
        name: 'Mistral: Codestral 2501',
        type: 'text',
    },
    {
        id: 'microsoft/phi-4',
        name: 'Microsoft: Phi 4',
        type: 'text',
    },
    {
        id: 'sao10k/l3.1-70b-hanami-x1',
        name: 'Sao10K: Llama 3.1 70B Hanami x1',
        type: 'text',
    },
    {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek: DeepSeek V3',
        type: 'text',
    },
    {
        id: 'sao10k/l3.3-euryale-70b',
        name: 'Sao10K: Llama 3.3 Euryale 70B',
        type: 'text',
    },
    {
        id: 'openai/o1',
        name: 'OpenAI: o1',
        type: 'text',
    },
    {
        id: 'cohere/command-r7b-12-2024',
        name: 'Cohere: Command R7B (12-2024)',
        type: 'text',
    },
    {
        id: 'google/gemini-2.0-flash-exp:free',
        name: 'Google: Gemini 2.0 Flash Experimental (free)',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        name: 'Meta: Llama 3.3 70B Instruct (free)',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Meta: Llama 3.3 70B Instruct',
        type: 'text',
    },
    {
        id: 'amazon/nova-lite-v1',
        name: 'Amazon: Nova Lite 1.0',
        type: 'text',
    },
    {
        id: 'amazon/nova-micro-v1',
        name: 'Amazon: Nova Micro 1.0',
        type: 'text',
    },
    {
        id: 'amazon/nova-pro-v1',
        name: 'Amazon: Nova Pro 1.0',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-2024-11-20',
        name: 'OpenAI: GPT-4o (2024-11-20)',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-large-2411',
        name: 'Mistral Large 2411',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-large-2407',
        name: 'Mistral Large 2407',
        type: 'text',
    },
    {
        id: 'mistralai/pixtral-large-2411',
        name: 'Mistral: Pixtral Large 2411',
        type: 'text',
    },
    {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen2.5 Coder 32B Instruct',
        type: 'text',
    },
    {
        id: 'raifle/sorcererlm-8x22b',
        name: 'SorcererLM 8x22B',
        type: 'text',
    },
    {
        id: 'thedrummer/unslopnemo-12b',
        name: 'TheDrummer: UnslopNemo 12B',
        type: 'text',
    },
    {
        id: 'anthropic/claude-3.5-haiku-20241022',
        name: 'Anthropic: Claude 3.5 Haiku (2024-10-22)',
        type: 'text',
    },
    {
        id: 'anthropic/claude-3.5-haiku',
        name: 'Anthropic: Claude 3.5 Haiku',
        type: 'text',
    },
    {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Anthropic: Claude 3.5 Sonnet',
        type: 'text',
    },
    {
        id: 'anthracite-org/magnum-v4-72b',
        name: 'Magnum v4 72B',
        type: 'text',
    },
    {
        id: 'mistralai/ministral-8b',
        name: 'Mistral: Ministral 8B',
        type: 'text',
    },
    {
        id: 'mistralai/ministral-3b',
        name: 'Mistral: Ministral 3B',
        type: 'text',
    },
    {
        id: 'qwen/qwen-2.5-7b-instruct',
        name: 'Qwen: Qwen2.5 7B Instruct',
        type: 'text',
    },
    {
        id: 'nvidia/llama-3.1-nemotron-70b-instruct',
        name: 'NVIDIA: Llama 3.1 Nemotron 70B Instruct',
        type: 'text',
    },
    {
        id: 'inflection/inflection-3-pi',
        name: 'Inflection: Inflection 3 Pi',
        type: 'text',
    },
    {
        id: 'inflection/inflection-3-productivity',
        name: 'Inflection: Inflection 3 Productivity',
        type: 'text',
    },
    {
        id: 'thedrummer/rocinante-12b',
        name: 'TheDrummer: Rocinante 12B',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.2-3b-instruct:free',
        name: 'Meta: Llama 3.2 3B Instruct (free)',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.2-3b-instruct',
        name: 'Meta: Llama 3.2 3B Instruct',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.2-1b-instruct',
        name: 'Meta: Llama 3.2 1B Instruct',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.2-90b-vision-instruct',
        name: 'Meta: Llama 3.2 90B Vision Instruct',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.2-11b-vision-instruct',
        name: 'Meta: Llama 3.2 11B Vision Instruct',
        type: 'text',
    },
    {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen2.5 72B Instruct',
        type: 'text',
    },
    {
        id: 'neversleep/llama-3.1-lumimaid-8b',
        name: 'NeverSleep: Lumimaid v0.2 8B',
        type: 'text',
    },
    {
        id: 'mistralai/pixtral-12b',
        name: 'Mistral: Pixtral 12B',
        type: 'text',
    },
    {
        id: 'cohere/command-r-08-2024',
        name: 'Cohere: Command R (08-2024)',
        type: 'text',
    },
    {
        id: 'cohere/command-r-plus-08-2024',
        name: 'Cohere: Command R+ (08-2024)',
        type: 'text',
    },
    {
        id: 'sao10k/l3.1-euryale-70b',
        name: 'Sao10K: Llama 3.1 Euryale 70B v2.2',
        type: 'text',
    },
    {
        id: 'qwen/qwen-2.5-vl-7b-instruct',
        name: 'Qwen: Qwen2.5-VL 7B Instruct',
        type: 'text',
    },
    {
        id: 'microsoft/phi-3.5-mini-128k-instruct',
        name: 'Microsoft: Phi-3.5 Mini 128K Instruct',
        type: 'text',
    },
    {
        id: 'nousresearch/hermes-3-llama-3.1-70b',
        name: 'Nous: Hermes 3 70B Instruct',
        type: 'text',
    },
    {
        id: 'nousresearch/hermes-3-llama-3.1-405b:free',
        name: 'Nous: Hermes 3 405B Instruct (free)',
        type: 'text',
    },
    {
        id: 'nousresearch/hermes-3-llama-3.1-405b',
        name: 'Nous: Hermes 3 405B Instruct',
        type: 'text',
    },
    {
        id: 'openai/chatgpt-4o-latest',
        name: 'OpenAI: ChatGPT-4o',
        type: 'text',
    },
    {
        id: 'sao10k/l3-lunaris-8b',
        name: 'Sao10K: Llama 3 8B Lunaris',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-2024-08-06',
        name: 'OpenAI: GPT-4o (2024-08-06)',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.1-405b',
        name: 'Meta: Llama 3.1 405B (base)',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Meta: Llama 3.1 70B Instruct',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.1-405b-instruct',
        name: 'Meta: Llama 3.1 405B Instruct',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3.1-8b-instruct',
        name: 'Meta: Llama 3.1 8B Instruct',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-nemo',
        name: 'Mistral: Mistral Nemo',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-mini-2024-07-18',
        name: 'OpenAI: GPT-4o-mini (2024-07-18)',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-mini',
        name: 'OpenAI: GPT-4o-mini',
        type: 'text',
    },
    {
        id: 'google/gemma-2-27b-it',
        name: 'Google: Gemma 2 27B',
        type: 'text',
    },
    {
        id: 'google/gemma-2-9b-it',
        name: 'Google: Gemma 2 9B',
        type: 'text',
    },
    {
        id: 'sao10k/l3-euryale-70b',
        name: 'Sao10k: Llama 3 Euryale 70B v2.1',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-7b-instruct:free',
        name: 'Mistral: Mistral 7B Instruct (free)',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-7b-instruct',
        name: 'Mistral: Mistral 7B Instruct',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-7b-instruct-v0.3',
        name: 'Mistral: Mistral 7B Instruct v0.3',
        type: 'text',
    },
    {
        id: 'nousresearch/hermes-2-pro-llama-3-8b',
        name: 'NousResearch: Hermes 2 Pro - Llama-3 8B',
        type: 'text',
    },
    {
        id: 'microsoft/phi-3-mini-128k-instruct',
        name: 'Microsoft: Phi-3 Mini 128K Instruct',
        type: 'text',
    },
    {
        id: 'microsoft/phi-3-medium-128k-instruct',
        name: 'Microsoft: Phi-3 Medium 128K Instruct',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-guard-2-8b',
        name: 'Meta: LlamaGuard 2 8B',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o',
        name: 'OpenAI: GPT-4o',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o:extended',
        name: 'OpenAI: GPT-4o (extended)',
        type: 'text',
    },
    {
        id: 'openai/gpt-4o-2024-05-13',
        name: 'OpenAI: GPT-4o (2024-05-13)',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3-8b-instruct',
        name: 'Meta: Llama 3 8B Instruct',
        type: 'text',
    },
    {
        id: 'meta-llama/llama-3-70b-instruct',
        name: 'Meta: Llama 3 70B Instruct',
        type: 'text',
    },
    {
        id: 'mistralai/mixtral-8x22b-instruct',
        name: 'Mistral: Mixtral 8x22B Instruct',
        type: 'text',
    },
    {
        id: 'microsoft/wizardlm-2-8x22b',
        name: 'WizardLM-2 8x22B',
        type: 'text',
    },
    {
        id: 'openai/gpt-4-turbo',
        name: 'OpenAI: GPT-4 Turbo',
        type: 'text',
    },
    {
        id: 'anthropic/claude-3-haiku',
        name: 'Anthropic: Claude 3 Haiku',
        type: 'text',
    },
    {
        id: 'anthropic/claude-3-opus',
        name: 'Anthropic: Claude 3 Opus',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-large',
        name: 'Mistral Large',
        type: 'text',
    },
    {
        id: 'openai/gpt-4-turbo-preview',
        name: 'OpenAI: GPT-4 Turbo Preview',
        type: 'text',
    },
    {
        id: 'openai/gpt-3.5-turbo-0613',
        name: 'OpenAI: GPT-3.5 Turbo (older v0613)',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-tiny',
        name: 'Mistral Tiny',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-small',
        name: 'Mistral Small',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-7b-instruct-v0.2',
        name: 'Mistral: Mistral 7B Instruct v0.2',
        type: 'text',
    },
    {
        id: 'mistralai/mixtral-8x7b-instruct',
        name: 'Mistral: Mixtral 8x7B Instruct',
        type: 'text',
    },
    {
        id: 'neversleep/noromaid-20b',
        name: 'Noromaid 20B',
        type: 'text',
    },
    {
        id: 'alpindale/goliath-120b',
        name: 'Goliath 120B',
        type: 'text',
    },
    {
        id: 'openrouter/auto',
        name: 'Auto Router',
        type: 'text',
    },
    {
        id: 'openai/gpt-4-1106-preview',
        name: 'OpenAI: GPT-4 Turbo (older v1106)',
        type: 'text',
    },
    {
        id: 'mistralai/mistral-7b-instruct-v0.1',
        name: 'Mistral: Mistral 7B Instruct v0.1',
        type: 'text',
    },
    {
        id: 'openai/gpt-3.5-turbo-instruct',
        name: 'OpenAI: GPT-3.5 Turbo Instruct',
        type: 'text',
    },
    {
        id: 'openai/gpt-3.5-turbo-16k',
        name: 'OpenAI: GPT-3.5 Turbo 16k',
        type: 'text',
    },
    {
        id: 'mancer/weaver',
        name: 'Mancer: Weaver (alpha)',
        type: 'text',
    },
    {
        id: 'undi95/remm-slerp-l2-13b',
        name: 'ReMM SLERP 13B',
        type: 'text',
    },
    {
        id: 'gryphe/mythomax-l2-13b',
        name: 'MythoMax 13B',
        type: 'text',
    },
    {
        id: 'openai/gpt-3.5-turbo',
        name: 'OpenAI: GPT-3.5 Turbo',
        type: 'text',
    },
    {
        id: 'openai/gpt-4',
        name: 'OpenAI: GPT-4',
        type: 'text',
    },
    {
        id: 'openai/gpt-4-0314',
        name: 'OpenAI: GPT-4 (older v0314)',
        type: 'text',
    },
];

export type OpenRouterProviderConfig = {
    apiKey: string;
}

export const openRouterProvider: AIProviderStrategy<OpenRouterProviderConfig> = {
    name() {
        return 'Open Router';
    },

    async listModels(): Promise<ProviderModel[]> {
        return openRouterModels;
    },

    validateConfig(config: object): OpenRouterProviderConfig {
        if ('apiKey' in config && typeof config.apiKey === 'string') {
            return {
                apiKey: config.apiKey,
            }
        }

        throw new ActivepiecesError({
            code: ErrorCode.INVALID_API_KEY,
            params: {}
        })
    },

    configSchema() {
        return [
            {
                attribute: 'apiKey',
                label: 'API Key',
                type: 'string',
            },
        ]
    },

    authHeaders(config: OpenRouterProviderConfig) {
        return {}
    }
};
