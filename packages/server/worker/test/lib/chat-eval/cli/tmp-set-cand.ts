import { evalFixtures } from '../core/fixtures-loader'
import { evalPrompts } from '../core/prompts'
import { chatEvalRunner } from '../core/runner'
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
    const summary: string[] = []
    for (const id of IDS) {
        const fixture = all.find((f) => f.id === id)!
        const c = await chatEvalRunner.evaluateFixture({ fixture, systemPrompt: s.candidate.systemPrompt, guides: s.candidate.guides })
        const verdict = c.judge[0].pass ? 'PASS' : 'FAIL'
        summary.push(`${id.padEnd(38)} ${verdict}`)
        console.log(`\n===== ${id}: ${verdict} =====`)
        console.log('reason:', c.judge[0].reason)
        console.log('--- transcript ---\n' + c.transcript)
    }
    await chatEvalRunner.cleanupAuth()
    console.log('\n================ SUMMARY (candidate) ================')
    for (const l of summary) console.log(l)
}
main().catch((e) => { console.error(e); process.exit(1) })
