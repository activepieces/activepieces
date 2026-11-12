function create({ creditsLeft, messageCredits }: { creditsLeft: (pendingCredits: number) => Promise<number | null>, messageCredits: number }): (runKey: string) => (pendingCredits: number) => Promise<number | null> {
    const pendingByRun = new Map<string, number>()
    return (runKey) => (pendingCredits) => {
        pendingByRun.set(runKey, pendingCredits)
        const runs = [...pendingByRun.values()]
        const messageChargedOnce = messageCredits * (runs.length - 1)
        return creditsLeft(runs.reduce((sum, value) => sum + value, 0) - messageChargedOnce)
    }
}

export const creditLedger = {
    create,
}
