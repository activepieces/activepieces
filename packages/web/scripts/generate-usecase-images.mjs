/**
 * Generates the cinematic card art for the chat start page (one style:
 * bold graphic illustration · trio colors · single hero object), using the
 * platform's fal.ai key (recraft-v3).
 *
 * It reads the encrypted fal key straight from the local Postgres
 * `ai_tool_config` table and decrypts it the way the server does
 * (AES-256-CBC, key = Buffer.from(hexKeyString, 'binary')); env is loaded from
 * .env.dev / .env automatically. Output is downscaled to ~900px webp via the
 * dwebp → sips → cwebp pipeline so the shipped assets stay small.
 *
 * Run from repo root:
 *   node packages/web/scripts/generate-usecase-images.mjs
 *
 * Optional overrides:
 *   FAL_KEY=...                  skip the DB, use this fal key directly
 *   ONLY_CARDS=clients,inbox     generate just these cards
 */
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../..')
const OUT_ROOT = path.join(REPO_ROOT, 'packages/web/public/chat-suggestions/cards')

const MODEL = 'fal-ai/recraft-v3'
const STYLE =
    'Bold high-contrast graphic cinematic illustration, dramatic simplified shapes, striking negative space.'
const COMMON = [
    'Dramatic cinematic composition, atmospheric depth, evocative and suspenseful, premium and high-end.',
    'Keep calm, darker, empty negative space across the lower-left third of the frame.',
    'Absolutely NO text, no letters, no words, no numbers, no typography, no captions, no watermark, no logo, no signage of any kind.',
].join(' ')

const grade = (colors) =>
    `Color: confident cinematic grade dominated by ${colors}; one clear color identity, cohesive and balanced, never muddy.`

// Wide, diverse palette so the grid reads colorful and varied (not a repeating
// 3-hue pattern). The 3 hero keys are kept for the loved hero images.
const HUE = {
    'orange-pink': grade('warm orange and soft pink'),
    'teal-emerald': grade('teal and emerald green'),
    'violet-magenta': grade('violet and magenta'),
    amber: grade('warm amber and gold'),
    crimson: grade('crimson and rose red'),
    cobalt: grade('electric cobalt blue and cyan'),
    emerald: grade('emerald and jade green'),
    violet: grade('violet and deep purple'),
    magenta: grade('magenta and hot pink'),
    teal: grade('teal and bright aqua'),
    orange: grade('burnt orange and ember'),
    indigo: grade('indigo and midnight blue'),
    coral: grade('coral and warm peach'),
    lime: grade('lime and chartreuse green'),
    turquoise: grade('turquoise and mint'),
    scarlet: grade('scarlet red and ember orange'),
    royal: grade('royal blue and sapphire'),
    plum: grade('plum and mauve purple'),
    gold: grade('sunset gold and copper'),
    rose: grade('rose pink and blush'),
    cyan: grade('bright cyan and ice blue'),
}

// Each card = one luminous hero object/phenomenon, abstractly relevant to the
// goal, suspenseful, never literal. Keep concepts to abstract LIGHT/NATURE (no
// man-made informational objects — those make recraft render gibberish text).
// `category` groups the cards in the UI; `hue` is a distinct color per card.
const CARDS = [
    // Sales
    { id: 'fill-pipeline', category: 'Sales', hue: 'amber', object: 'a luminous channel carved through darkness slowly filling with a flowing stream of bright motes converging from the far distance' },
    { id: 'close-deals', category: 'Sales', hue: 'crimson', object: 'two halves of a glowing arch meeting and locking into a radiant keystone of light' },
    { id: 'take-from-rivals', category: 'Sales', hue: 'violet', object: 'a strong beam reaching across darkness to draw a cluster of glowing orbs away from a distant dimming cluster toward the foreground' },
    { id: 'chase-leads', category: 'Sales', hue: 'cobalt', object: 'a determined comet of light streaking across darkness in pursuit of scattered distant glowing orbs' },
    // Finance
    { id: 'get-invoices-paid', category: 'Finance', hue: 'emerald', object: 'streams of glowing coin-like motes of light flowing inward through the dark and gathering into one bright pool' },
    { id: 'chase-late-payers', category: 'Finance', hue: 'scarlet', object: 'a swift comet of light hunting a single elusive glowing orb fleeing across a dark plain' },
    // Marketing
    { id: 'grow-following', category: 'Marketing', hue: 'magenta', object: 'a single bright point blossoming into a vast spreading constellation of glowing connected dots' },
    { id: 'run-socials', category: 'Marketing', hue: 'teal', object: 'a calm glowing core encircled by orbiting luminous rounded orbs in steady graceful motion' },
    { id: 'write-posts', category: 'Marketing', hue: 'gold', object: 'a fountain of luminous ribbons streaming outward in graceful arcs from a single bright source' },
    // Customers
    { id: 'win-back-customers', category: 'Customers', hue: 'orange', object: 'a warm beam reaching far into the dark, drawing a drifting distant light gently back toward home' },
    { id: 'answer-customers', category: 'Customers', hue: 'turquoise', object: 'a calm beam resolving a restless swarm of sparks into steady still points of light' },
    { id: 'onboard-signups', category: 'Customers', hue: 'lime', object: 'a glowing staircase of light leading a small bright orb upward into warmth' },
    // Exec & personal
    { id: 'prep-meetings', category: 'Exec', hue: 'indigo', object: 'a focused spotlight assembling scattered shards of light into one clear glowing orb' },
    { id: 'run-my-day', category: 'Exec', hue: 'coral', object: 'a luminous arc of ordered glowing waypoints sweeping across darkness toward a bright rising dawn' },
    { id: 'clone-me', category: 'Exec', hue: 'plum', object: 'a single radiant figure of light multiplying into a fan of mirrored glowing silhouettes radiating outward in unison' },
    // Hiring
    { id: 'do-my-hiring', category: 'Hiring', hue: 'royal', object: 'a bright beam sweeping over a field of glowing silhouettes and lifting a chosen few gently upward into the light' },
    // Engineering
    { id: 'squash-bugs', category: 'Engineering', hue: 'cyan', object: 'a bright blade of light sweeping through a swarm of restless glitching sparks in darkness, scattering them into clean calm drifting motes' },
]

const IMAGE_SIZE = 'landscape_16_9'
const MAX_WIDTH = 900
const POOL = 4

async function main() {
    loadEnvFiles([path.join(REPO_ROOT, '.env.dev'), path.join(REPO_ROOT, '.env')])

    const apiKey = process.env.FAL_KEY?.trim() || (await resolveFalKeyFromDb())
    if (!apiKey) {
        throw new Error(
            'Could not obtain a fal.ai key. Configure it in Platform Admin → AI capabilities (Image generation), or pass FAL_KEY=...',
        )
    }
    console.log('✓ fal.ai key resolved')

    const onlyCards = parseList(process.env.ONLY_CARDS)
    const cards = onlyCards ? CARDS.filter((c) => onlyCards.includes(c.id)) : CARDS

    fs.mkdirSync(OUT_ROOT, { recursive: true })
    console.log(`Generating ${cards.length} cards → ${OUT_ROOT}\n`)

    const results = await runPool(cards, POOL, async (card) => {
        const prompt = `${STYLE} Scene: ${card.object}. ${HUE[card.hue]} ${COMMON}`
        try {
            const image = await generateImageWithFal({ apiKey, prompt })
            const finalPath = path.join(OUT_ROOT, `${card.id}.webp`)
            const bytes = optimizeWebp(image.bytes, image.extension)
            fs.writeFileSync(finalPath, bytes)
            console.log(
                `  ✓ ${card.id} (${card.hue}) → ${Math.round(bytes.length / 1024)}KB`,
            )
            return { id: card.id, ok: true }
        }
        catch (err) {
            console.error(`  ✗ ${card.id} — ${err?.message ?? err}`)
            return { id: card.id, ok: false }
        }
    })

    const ok = results.filter((r) => r.ok).length
    console.log(`\nDone. ${ok}/${results.length} succeeded.`)
    if (ok < results.length) {
        console.log('Re-run with ONLY_CARDS=<id,id> to retry just the failures.')
    }
}

// Downscale to MAX_WIDTH and re-encode webp via dwebp → sips → cwebp.
// Falls back to the raw bytes if the local tools are unavailable.
function optimizeWebp(rawBytes, extension) {
    const tmp = os.tmpdir()
    const stamp = `${process.pid}-${Math.round(performance.now())}-${Math.random().toString(36).slice(2)}`
    const rawPath = path.join(tmp, `uc-${stamp}.${extension}`)
    const pngPath = path.join(tmp, `uc-${stamp}.png`)
    const outPath = path.join(tmp, `uc-${stamp}.out.webp`)
    try {
        fs.writeFileSync(rawPath, rawBytes)
        if (extension === 'webp') {
            execFileSync('dwebp', [rawPath, '-o', pngPath], { stdio: 'ignore' })
        }
        else {
            execFileSync('sips', ['-s', 'format', 'png', rawPath, '--out', pngPath], { stdio: 'ignore' })
        }
        execFileSync('sips', ['-Z', String(MAX_WIDTH), pngPath, '--out', pngPath], { stdio: 'ignore' })
        execFileSync('cwebp', ['-q', '82', pngPath, '-o', outPath], { stdio: 'ignore' })
        return fs.readFileSync(outPath)
    }
    catch {
        return rawBytes
    }
    finally {
        for (const f of [rawPath, pngPath, outPath]) {
            try {
                fs.unlinkSync(f)
            }
            catch {
                // ignore
            }
        }
    }
}

async function generateImageWithFal({ apiKey, prompt }) {
    const submit = await falFetch(`https://fal.run/${MODEL}`, {
        method: 'POST',
        headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            image_size: IMAGE_SIZE,
            num_images: 1,
            style: 'digital_illustration',
        }),
    })
    const body = await submit.json()
    const imageUrl = body?.images?.[0]?.url
    if (!imageUrl) {
        throw new Error(
            `no image url in response: ${JSON.stringify(body).slice(0, 300)}`,
        )
    }
    const contentType = body.images[0].content_type ?? 'image/webp'
    const download = await falFetch(imageUrl, {})
    const bytes = Buffer.from(await download.arrayBuffer())
    const extension = contentType.includes('png')
        ? 'png'
        : contentType.includes('jpeg') || contentType.includes('jpg')
            ? 'jpg'
            : 'webp'
    return { bytes, extension }
}

async function falFetch(url, init) {
    let lastErr
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const res = await fetch(url, init)
            if (!res.ok) {
                const text = await res.text().catch(() => '')
                throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`)
            }
            return res
        }
        catch (err) {
            lastErr = err
            await sleep(1500)
        }
    }
    throw lastErr
}

async function resolveFalKeyFromDb() {
    const candidateKeys = collectEncryptionKeys()
    if (candidateKeys.length === 0) {
        throw new Error(
            'No AP_ENCRYPTION_KEY found (env, .env.dev, .env, or settings.json). Pass FAL_KEY=... to skip the DB.',
        )
    }
    const client = new pg.Client(buildPgConfig())
    await client.connect()
    let auth
    try {
        const { rows } = await client.query(
            "SELECT auth FROM ai_tool_config WHERE provider = 'fal' AND capability = 'IMAGE_GENERATION' LIMIT 1",
        )
        if (rows.length === 0) {
            throw new Error(
                'No fal IMAGE_GENERATION row in ai_tool_config — add the key in Platform Admin → AI capabilities first.',
            )
        }
        auth =
            typeof rows[0].auth === 'string'
                ? JSON.parse(rows[0].auth)
                : rows[0].auth
    }
    finally {
        await client.end()
    }
    for (const { source, key } of candidateKeys) {
        try {
            const decrypted = decryptObject(auth, key)
            if (decrypted?.apiKey) {
                console.log(`✓ decrypted fal key using ${source}`)
                return decrypted.apiKey
            }
        }
        catch {
            // wrong key, try the next candidate
        }
    }
    throw new Error(
        `Found ${candidateKeys.length} candidate encryption key(s) but none decrypted the stored fal auth. Pass FAL_KEY=... to skip the DB.`,
    )
}

function decryptObject(encrypted, secret) {
    const iv = Buffer.from(encrypted.iv, 'hex')
    const key = Buffer.from(secret, 'binary')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return JSON.parse(decrypted)
}

function collectEncryptionKeys() {
    const keys = []
    const push = (source, value) => {
        const trimmed = value?.toString().trim()
        if (trimmed && !keys.some((k) => k.key === trimmed)) {
            keys.push({ source, key: trimmed })
        }
    }
    push('env AP_ENCRYPTION_KEY', process.env.AP_ENCRYPTION_KEY)
    const settingsFiles = [
        process.env.AP_CONFIG_PATH &&
            path.resolve(REPO_ROOT, process.env.AP_CONFIG_PATH, 'settings.json'),
        path.join(REPO_ROOT, 'dev/config/settings.json'),
        path.join(os.homedir(), '.activepieces', 'settings.json'),
    ].filter(Boolean)
    for (const file of settingsFiles) {
        try {
            const json = JSON.parse(fs.readFileSync(file, 'utf8'))
            push(path.relative(REPO_ROOT, file), json.ENCRYPTION_KEY)
        }
        catch {
            // ignore missing/unreadable candidate
        }
    }
    return keys
}

function buildPgConfig() {
    if (process.env.AP_POSTGRES_URL) {
        return { connectionString: process.env.AP_POSTGRES_URL }
    }
    const host = process.env.AP_POSTGRES_HOST ?? 'localhost'
    return {
        host: host === 'postgres' ? 'localhost' : host,
        port: Number(process.env.AP_POSTGRES_PORT ?? 5432),
        database: process.env.AP_POSTGRES_DATABASE ?? 'activepieces',
        user: process.env.AP_POSTGRES_USERNAME ?? 'postgres',
        password: process.env.AP_POSTGRES_PASSWORD ?? 'A79Vm5D4p2VQHOp2gd5',
    }
}

function loadEnvFiles(files) {
    for (const file of files) {
        let content
        try {
            content = fs.readFileSync(file, 'utf8')
        }
        catch {
            continue
        }
        for (const raw of content.split('\n')) {
            const line = raw.trim()
            if (!line || line.startsWith('#')) {
                continue
            }
            const eq = line.indexOf('=')
            if (eq === -1) {
                continue
            }
            const k = line.slice(0, eq).trim()
            if (k in process.env) {
                continue
            }
            let v = line.slice(eq + 1).trim()
            if (
                (v.startsWith('"') && v.endsWith('"')) ||
                (v.startsWith("'") && v.endsWith("'"))
            ) {
                v = v.slice(1, -1)
            }
            process.env[k] = v
        }
    }
}

async function runPool(items, size, worker) {
    const results = new Array(items.length)
    let next = 0
    async function drain() {
        while (next < items.length) {
            const i = next++
            results[i] = await worker(items[i])
        }
    }
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, drain))
    return results
}

function parseList(value) {
    if (!value) {
        return null
    }
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

main().catch((err) => {
    console.error('\nFATAL:', err?.message ?? err)
    process.exit(1)
})
