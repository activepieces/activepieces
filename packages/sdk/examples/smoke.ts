/**
 * Manual smoke test for @activepieces/sdk against a local EE/Cloud instance.
 *
 * Run with:
 *   AP_API_KEY=sk-... AP_INSTANCE_URL=http://localhost:3000 npx tsx packages/sdk/examples/smoke.ts
 *
 * The platform behind the API key must have `headlessSdkEnabled` turned on.
 */
import { createClient } from '../src'

async function main(): Promise<void> {
    const apiKey = process.env.AP_API_KEY
    const instanceUrl = process.env.AP_INSTANCE_URL ?? 'http://localhost:3000'
    if (apiKey === undefined) {
        throw new Error('Set AP_API_KEY to a platform API key (sk-...).')
    }

    const client = createClient({ apiKey, instanceUrl })

    const session = await client.project('sdk-smoke-project')
    console.log('project:', session.projectId)

    const pieces = await session.pieces.list({ searchQuery: 'http' })
    console.log('pieces found:', pieces.length, pieces.slice(0, 3).map((piece) => piece.name))

    const connections = await session.connections.list({})
    console.log('connections:', connections.length)

    const result = await session.actions.run({
        pieceName: '@activepieces/piece-http',
        actionName: 'send_request',
        props: {
            method: 'GET',
            url: 'https://cloud.activepieces.com/api/v1/pieces',
        },
    })
    console.log('action result isError:', result.isError)
    console.log('action result text:', result.text.slice(0, 200))
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
