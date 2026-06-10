export class StepExecutionPath {
    public path: readonly [string, number][] = []

    constructor(path: readonly [string, number][]) {
        this.path = [...path]
    }

    loopIteration({ loopName, iteration }: { loopName: string, iteration: number }): StepExecutionPath {
        return new StepExecutionPath([...this.path, [loopName, iteration]])
    }

    static empty(): StepExecutionPath {
        return new StepExecutionPath([])
    }

    removeLast(): StepExecutionPath {
        const newPath = this.path.slice(0, -1)
        return new StepExecutionPath(newPath)
    }
}
