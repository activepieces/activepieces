export const openRouterModels  = [
    { label: 'OpenAI: GPT-3.5 Turbo' , value: 'openai/gpt-3.5-turbo' },
    { label: 'OpenAI: GPT-3.5 Turbo 16k' , value: 'openai/gpt-3.5-turbo-16k' },
    { label: 'OpenAI: GPT-4' , value: 'openai/gpt-4' },
    { label: 'OpenAI: GPT-4 32k' , value: 'openai/gpt-4-32k' },
    { label: 'Anthropic: Claude v2' , value: 'anthropic/claude-2' },
    { label: 'Anthropic: Claude Instant v1' , value: 'anthropic/claude-instant-v1' },
    { label: 'Google: PaLM 2 Bison' , value: 'google/palm-2-chat-bison' },
    { label: 'Google: PaLM 2 Bison (Code Chat)' , value: 'google/palm-2-codechat-bison' },
    { label: 'Meta: Llama v2 13B Chat (beta)' , value: 'meta-llama/llama-2-13b-chat' },
    { label: 'Meta: Llama v2 70B Chat (beta)' , value: 'meta-llama/llama-2-70b-chat' },
    { label: 'Meta: CodeLlama 34B Instruct (beta)' , value: 'meta-llama/codellama-34b-instruct' },
    { label: 'Nous: Hermes Llama2 13B (beta)' , value: 'nousresearch/nous-hermes-llama2-13b' },
    { label: 'Mancer: Weaver 12k (alpha)' , value: 'mancer/weaver' },
    { label: 'MythoMax L2 13B (beta)' , value: 'gryphe/mythomax-l2-13b' },
    { label: 'Airoboros L2 70B (beta)' , value: 'jondurbin/airoboros-l2-70b-2.1' },
    { label: 'ReMM SLERP L2 13B (beta)' , value: 'undi95/remm-slerp-l2-13b' },
    { label: 'Mythalion 13B (NEW)' , value: 'pygmalionai/mythalion-13b' },
    { label: 'OpenAI: GPT-3.5 Turbo (older v0301)' , value: 'openai/gpt-3.5-turbo-0301' },
    { label: 'OpenAI: GPT-4 (older v0314)' , value: 'openai/gpt-4-0314' },
    { label: 'OpenAI: GPT-4 32k (older v0314)' , value: 'openai/gpt-4-32k-0314' },
    { label: 'OpenAI: Davinci (No RL)' , value: 'openai/text-davinci-002' },
    { label: 'Anthropic: Claude v1' , value: 'anthropic/claude-v1' },
    { label: 'Anthropic: Claude (older v1)' , value: 'anthropic/claude-1.2' },
    { label: 'Anthropic: Claude Instant 100k v1' , value: 'anthropic/claude-instant-v1-100k' },
    { label: 'Anthropic: Claude 100k v1' , value: 'anthropic/claude-v1-100k' },
    { label: 'Anthropic: Claude Instant (older v1)' , value: 'anthropic/claude-instant-1.0' },
    { label: 'OpenAI: Shap-e (beta)' , value: 'openai/shap-e' },
];
export interface promptResponse {
    choices: {
        text: string;
    }[],
    model: string;
    id: string;
}