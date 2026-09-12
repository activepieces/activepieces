import { StepExecutionPath } from '../../../src/lib/handler/context/step-execution-path'

describe('StepExecutionPath#waitpointKeyFor', () => {
    it('returns the bare step name outside a loop', () => {
        expect(StepExecutionPath.empty().waitpointKeyFor({ stepName: 'approval' })).toBe('approval')
    })

    it('qualifies the step name with every enclosing iteration, so each iteration gets its own waitpoint', () => {
        const path = StepExecutionPath.empty()
            .loopIteration({ loopName: 'loop_1', iteration: 3 })
            .loopIteration({ loopName: 'loop_2', iteration: 0 })

        expect(path.waitpointKeyFor({ stepName: 'approval' })).toBe('loop_1:3/loop_2:0/approval')
    })

    it('gives two iterations of the same loop different keys', () => {
        const first = StepExecutionPath.empty().loopIteration({ loopName: 'loop_1', iteration: 0 })
        const second = StepExecutionPath.empty().loopIteration({ loopName: 'loop_1', iteration: 1 })

        expect(first.waitpointKeyFor({ stepName: 'approval' })).not.toBe(second.waitpointKeyFor({ stepName: 'approval' }))
    })
})
