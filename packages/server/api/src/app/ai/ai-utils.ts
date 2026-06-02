export const aiUtils = {
    calculateCredits(usage: { inputTokens: number, outputTokens: number }): number {
        // TODO: replace with proper pricing per model
        return Math.ceil((usage.inputTokens + usage.outputTokens) * 10 / 1000)
    },
}
