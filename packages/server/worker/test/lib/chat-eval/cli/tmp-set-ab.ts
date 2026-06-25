import { evalFixtures } from '../core/fixtures-loader'
import { evalPrompts } from '../core/prompts'
import { chatEvalRunner } from '../core/runner'
const N = 2
const IDS = [
  'intent-self-as-agent-clone-me',
  'intent-self-as-agent-replicate-me',
  'intent-self-as-agent-be-assistant',
  'intent-self-as-agent-ai-version',
  'intent-self-as-agent-does-my-job',
  'guard-duplicate-flow-not-agent',
]
async function main(): Promise<void> {
    const all = evalFixtures.load()
    const s = evalPrompts.resolveSources({})
    console.log('changed (baseline!=candidate):', s.changed, '\n')
    const summary: string[] = []
    for (const id of IDS) {
        const fixture = all.find((f) => f.id === id)!
        let basePass = 0, candPass = 0
        let sampleTranscript = ''
        for (let i = 0; i < N; i++) {
            const b = await chatEvalRunner.evaluateFixture({ fixture, systemPrompt: s.baseline.systemPrompt, guides: s.baseline.guides })
            const c = await chatEvalRunner.evaluateFixture({ fixture, systemPrompt: s.candidate.systemPrompt, guides: s.candidate.guides })
            if (b.judge[0].pass) basePass++
            if (c.judge[0].pass) candPass++
            if (i === 0) sampleTranscript = c.transcript
        }
        const line = `${id.padEnd(38)} baseline ${basePass}/${N}  candidate ${candPass}/${N}`
        summary.push(line)
        console.log('===== ' + id + ' =====')
        console.log(line)
        console.log('--- candidate sample transcript ---\n' + sampleTranscript + '\n')
    }
    await chatEvalRunner.cleanupAuth()
    console.log('\n================ SUMMARY ================')
    for (const l of summary) console.log(l)
}
main().catch((e) => { console.error(e); process.exit(1) })
