

export type StepExecutionPath = {
    path: readonly [string, number][]
    loopIteration: (args: { loopName: string, iteration: number }) => StepExecutionPath
    removeLast: () => StepExecutionPath
}

export const StepExecutionPath = {
    path: [],
    loopIteration({ loopName, iteration }: { loopName: string, iteration: number }): StepExecutionPath {
        return {
            ...this,
            path: [...this.path, [loopName, iteration]],
        }
    },
    empty(): StepExecutionPath {
        const path: readonly [string, number][] = []
        return {
            ...this,
            path,
        }
    },
    removeLast(): StepExecutionPath {
        return {
            ...this,
            path: this.path.slice(0, -1),
        }
    },
}
