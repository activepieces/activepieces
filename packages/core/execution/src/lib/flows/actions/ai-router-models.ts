function resolve(model: string | undefined): string {
    return MODELS.find((entry) => entry.id === model)?.id ?? DEFAULT_MODEL_ID
}

const MODELS: readonly AiRouterModel[] = [
    { id: 'typesafe/jev-1.14', label: 'TypeSafe Jev 1.14' },
    { id: 'typesafe/jev-1.13', label: 'TypeSafe Jev 1.13' },
    { id: 'cloudflare/clef', label: 'Cloudflare Clef' },
    { id: 'cloudflare/clef-flash', label: 'Cloudflare Clef Flash' },
    { id: 'cloudflare/clef-omni', label: 'Cloudflare Clef Omni' },
    { id: 'google/gemini-decision-1', label: 'Google Gemini Decision 1' },
]

const DEFAULT_MODEL_ID = 'typesafe/jev-1.13'

export const aiRouterModels = {
    all: MODELS,
    defaultModelId: DEFAULT_MODEL_ID,
    resolve,
}

export type AiRouterModel = {
    id: string
    label: string
}
