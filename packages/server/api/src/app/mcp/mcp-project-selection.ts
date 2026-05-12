const selections = new Map<string, string>()

function makeKey({ platformId, userId }: { platformId: string, userId: string }): string {
    return `${platformId}:${userId}`
}

export const mcpProjectSelection = {
    get({ platformId, userId }: { platformId: string, userId: string }): string | null {
        return selections.get(makeKey({ platformId, userId })) ?? null
    },
    set({ platformId, userId, projectId }: { platformId: string, userId: string, projectId: string }): void {
        selections.set(makeKey({ platformId, userId }), projectId)
    },
    clear({ platformId, userId }: { platformId: string, userId: string }): void {
        selections.delete(makeKey({ platformId, userId }))
    },
}
