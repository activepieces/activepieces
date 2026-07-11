import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { FileCompression, FileType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from '../../ai/ai-provider-service'
import { aiToolConfigService } from '../../ai/ai-tool-config-service'
import { distributedLock } from '../../database/redis-connections'
import { fileService } from '../../file/file.service'
import { openRouterApi } from '../platform/platform-plan/openrouter/openrouter-api'
import { referralUtils } from './referral-flags'

// Ideogram follows literal spatial instructions ("inside", "on top") far better than other models,
// which is what makes the phrase's absurd picture accurate.
const HERO_IMAGE_MODEL = 'fal-ai/ideogram/v3'

export const referralSideEffects = (log: FastifyBaseLogger) => ({
    // Paint the phrase's literal absurd scene at mint. Best-effort: on any failure we return null and
    // the show falls back to a tasteful gradient — a missing picture must never break minting.
    async generateHeroImage({ platformId, projectId, phrase, scenePrompt }: GenerateHeroImageParams): Promise<HeroImageResult | null> {
        const { data: tools } = await tryCatch(() => aiToolConfigService(log).getEnabledTools({ platformId }))
        const apiKey = tools?.imageGeneration?.apiKey
        if (isNil(apiKey)) {
            log.warn({ platform: { id: platformId } }, '[referral] No image-generation provider — skipping hero image')
            return null
        }
        const fullPrompt = buildHeroPrompt({ phrase, scenePrompt })
        const generated = await tryCatch(async () => {
            const submit = await safeHttp.axios.post(`https://fal.run/${HERO_IMAGE_MODEL}`, {
                prompt: fullPrompt,
                image_size: 'landscape_16_9',
                num_images: 1,
                rendering_speed: 'QUALITY',
            }, {
                headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
                timeout: 90_000,
            })
            const image = submit.data?.images?.[0]
            const imageUrl: string | undefined = image?.url
            if (isNil(imageUrl)) {
                throw new Error('fal returned no image url')
            }
            const contentType: string = image?.content_type ?? 'image/jpeg'
            const download = await safeHttp.axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 60_000 })
            const data = Buffer.from(download.data)
            const file = await fileService(log).save({
                projectId,
                platformId,
                data,
                size: data.length,
                type: FileType.FLOW_STEP_FILE,
                fileName: `referral-hero-${apId()}.${contentType.includes('png') ? 'png' : 'jpg'}`,
                compression: FileCompression.NONE,
                metadata: { mimetype: contentType },
            })
            return file.id
        })
        if (!isNil(generated.error) || isNil(generated.data)) {
            log.warn({ platform: { id: platformId }, error: generated.error }, '[referral] Hero image generation failed')
            return null
        }
        return { fileId: generated.data, scenePrompt: fullPrompt }
    },
    async grantAiCredits({ platformId, amountInUsd }: GrantAiCreditsParams): Promise<void> {
        if (amountInUsd <= 0) {
            return
        }
        await distributedLock(log).runExclusive({
            key: `ai_credits_grant_${platformId}`,
            timeoutInSeconds: 30,
            fn: async () => {
                const grant = await tryCatch(async () => {
                    const { apiKeyHash } = await aiProviderService(log).getOrCreateActivePiecesProviderAuthConfig(platformId)
                    const { data: key } = await openRouterApi.getKey({ hash: apiKeyHash })
                    await openRouterApi.updateKey({
                        hash: apiKeyHash,
                        limit: key.limit! + amountInUsd,
                    })
                })
                if (!isNil(grant.error)) {
                    // Local dev (AP_REFERRAL_DEV_ENABLED) usually has no AI-credits provider
                    // configured, so log the intended grant and continue — the redemption flow still
                    // completes end-to-end. In production (Cloud) a provider always exists, so rethrow.
                    if (referralUtils.isReferralDevMode()) {
                        log.warn({ platform: { id: platformId }, amountInUsd, error: grant.error }, '[referral] Dev mode: skipped AI-credit grant (no provider configured)')
                        return
                    }
                    throw grant.error
                }
            },
        })
    },
})

// The model authors the literal scene (it knows the joke); we wrap it in a calm, tasteful cinematic
// style — the craziness lives in the ACCURATE depiction of the absurd idea, not a loud treatment.
function buildHeroPrompt({ phrase, scenePrompt }: { phrase: string, scenePrompt?: string }): string {
    const literal = scenePrompt?.trim()
        ? scenePrompt.trim()
        : `A scene that literally and accurately depicts: "${phrase}". Show exactly what the sentence says, taking it completely literally.`
    return `${literal} Calm, premium, cinematic storybook 3D illustration; warm soft lighting; rich detailed background; gentle depth of field; charming and tasteful, not chaotic. The composition must be literally accurate to the described scene. Absolutely no text, no letters, no words, no captions, no watermark, no signage.`
}

type GenerateHeroImageParams = {
    platformId: string
    projectId?: string
    phrase: string
    scenePrompt?: string
}

type HeroImageResult = {
    fileId: string
    scenePrompt: string
}

type GrantAiCreditsParams = {
    platformId: string
    amountInUsd: number
}
