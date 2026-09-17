import { isObject, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { SaveAgentFileResponse } from '@activepieces/shared'
import { tool, ToolExecutionOptions, ToolSet } from 'ai'
import { stripHtml } from 'string-strip-html'
import { z } from 'zod'
import { AgentEventEmitter, cardTitleFields, describeHttpError, FETCH_URL_TIMEOUT_MS, GeneratedImage, ImageAspect, ImageStyle, isReadableTextContentType, MAX_FETCH_URL_BYTES, ResolvedToolConfig, ScrapedPage, TaintState, truncateLargeResult, withToolTimeout } from './tool-primitives'

export function createWebTools({ taintState }: { taintState: TaintState }): ToolSet {
    return {
        ap_fetch_url: tool({
            description: 'Fetch the readable text of a public web page or API URL over HTTPS (read-only GET). Use it to read a specific page in full — e.g. the API docs you found via web search before building an http_fallback step, or a link the user shared. HTML is stripped to text; JSON/plain text is returned as-is.',
            inputSchema: z.object({
                ...cardTitleFields,
                url: z.string().describe('Absolute http(s) URL to fetch'),
            }),
            execute: async (toolInput) => {
                if (!/^https?:\/\//i.test(toolInput.url)) {
                    return { content: [{ type: 'text', text: `"${toolInput.url}" is not a valid http(s) URL.` }] }
                }
                taintState.tainted = true
                return withToolTimeout({
                    fn: async (signal) => {
                        const { data: response, error } = await tryCatch(() => safeHttp.axios.get<string>(toolInput.url, {
                            signal,
                            timeout: FETCH_URL_TIMEOUT_MS,
                            maxContentLength: MAX_FETCH_URL_BYTES,
                            maxBodyLength: MAX_FETCH_URL_BYTES,
                            responseType: 'text',
                            headers: {
                                'User-Agent': 'Activepieces-Chat',
                                Accept: 'text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.8',
                            },
                        }))
                        if (error) {
                            return { content: [{ type: 'text', text: `Failed to fetch ${toolInput.url}: ${error instanceof Error ? error.message : String(error)}` }] }
                        }
                        const contentType = String(response.headers['content-type'] ?? '')
                        if (!isReadableTextContentType(contentType)) {
                            return { content: [{ type: 'text', text: `${toolInput.url} returned ${contentType || 'unknown'} content, which can't be read as text.` }] }
                        }
                        const { data: text, error: parseError } = tryCatchSync(() => /html/i.test(contentType) ? stripHtml(response.data).result : response.data)
                        if (parseError) {
                            return { content: [{ type: 'text', text: `Failed to parse the content of ${toolInput.url}.` }] }
                        }
                        return truncateLargeResult({ url: toolInput.url, content: text })
                    },
                    timeoutMs: FETCH_URL_TIMEOUT_MS + 5_000,
                    toolName: 'ap_fetch_url',
                })
            },
        }),
    }
}

const SEARCH_TIMEOUT_MS = 30 * 1_000
const SCRAPE_TIMEOUT_MS = 60 * 1_000
const IMAGE_TIMEOUT_MS = 120 * 1_000
const MAX_SEARCH_RESULTS = 5

const FAL_MODEL_BY_STYLE: Record<ImageStyle, string> = {
    realistic: 'fal-ai/flux-pro/v1.1',
    graphic_text: 'fal-ai/ideogram/v3',
    brand_vector: 'fal-ai/recraft-v3',
    abstract: 'fal-ai/flux/dev',
}

const FAL_IMAGE_SIZE_BY_ASPECT: Record<ImageAspect, string> = {
    square: 'square_hd',
    landscape: 'landscape_16_9',
    portrait: 'portrait_16_9',
}

export function createSearchTools({ webSearch, taintState }: { webSearch: ResolvedToolConfig, taintState: TaintState }): ToolSet {
    return {
        ap_web_search: tool({
            description: 'Search the live web for current information using a dedicated search engine. Use it to find up-to-date facts, docs, news, or pages relevant to the user\'s request. Returns ranked results with titles, URLs, and content snippets; follow up with ap_fetch_url or ap_scrape_url to read a result in full.',
            inputSchema: z.object({
                ...cardTitleFields,
                query: z.string().describe('The search query'),
            }),
            execute: async (toolInput) => {
                taintState.tainted = true
                return withToolTimeout({
                    toolName: 'ap_web_search',
                    timeoutMs: SEARCH_TIMEOUT_MS + 5_000,
                    fn: async (signal) => {
                        const { data: response, error } = await tryCatch(() => safeHttp.axios.post('https://api.tavily.com/search', {
                            query: toolInput.query,
                            max_results: MAX_SEARCH_RESULTS,
                            include_answer: true,
                            search_depth: 'basic',
                        }, {
                            signal,
                            timeout: SEARCH_TIMEOUT_MS,
                            headers: { Authorization: `Bearer ${webSearch.apiKey}`, 'Content-Type': 'application/json' },
                        }))
                        if (error) {
                            return { content: [{ type: 'text', text: `Web search failed: ${error instanceof Error ? error.message : String(error)}` }] }
                        }
                        const body = isObject(response.data) ? response.data : {}
                        const rawResults = Array.isArray(body['results']) ? body['results'] : []
                        const results = rawResults.map((r) => {
                            const item = isObject(r) ? r : {}
                            return {
                                title: typeof item['title'] === 'string' ? item['title'] : '',
                                url: typeof item['url'] === 'string' ? item['url'] : '',
                                content: typeof item['content'] === 'string' ? item['content'] : '',
                            }
                        })
                        return truncateLargeResult({
                            query: toolInput.query,
                            answer: typeof body['answer'] === 'string' ? body['answer'] : undefined,
                            results,
                        })
                    },
                })
            },
        }),
    }
}

export function createScrapeTools({ scraping, taintState }: { scraping: ResolvedToolConfig, taintState: TaintState }): ToolSet {
    return {
        ap_scrape_url: tool({
            description: 'Scrape a web page and return its clean main content as markdown, including JavaScript-rendered pages. Prefer this over ap_fetch_url when you need the full, readable content of an article, docs page, or product page.',
            inputSchema: z.object({
                ...cardTitleFields,
                url: z.string().describe('Absolute http(s) URL to scrape'),
            }),
            execute: async (toolInput) => {
                if (!/^https?:\/\//i.test(toolInput.url)) {
                    return { content: [{ type: 'text', text: `"${toolInput.url}" is not a valid http(s) URL.` }] }
                }
                taintState.tainted = true
                return withToolTimeout({
                    toolName: 'ap_scrape_url',
                    timeoutMs: SCRAPE_TIMEOUT_MS + 5_000,
                    fn: async (signal) => {
                        const { data: scraped, error } = await tryCatch(() => scraping.provider === 'apify'
                            ? scrapeWithApify({ url: toolInput.url, apiKey: scraping.apiKey, signal })
                            : scrapeWithFirecrawl({ url: toolInput.url, apiKey: scraping.apiKey, signal }))
                        if (error) {
                            return { content: [{ type: 'text', text: `Failed to scrape ${toolInput.url}: ${error instanceof Error ? error.message : String(error)}` }] }
                        }
                        return truncateLargeResult({ url: toolInput.url, markdown: scraped.markdown, metadata: scraped.metadata })
                    },
                })
            },
        }),
    }
}

export function createImageTools({ imageGeneration, saveFile, emitImage }: {
    imageGeneration: ResolvedToolConfig
    saveFile: (params: { data: Buffer, mediaType: string, fileName?: string }) => Promise<SaveAgentFileResponse>
    emitImage: AgentEventEmitter['emitImageGenerated']
}): ToolSet {
    return {
        ap_generate_image: tool({
            description: 'Generate an image from a text description. Pick the right `style` for the task: "realistic" for photoreal images and product photos; "graphic_text" for social/email/marketing graphics that contain readable text, logos in layout, posters, or banners; "brand_vector" for clean logos, icons, and brand/vector-style graphics; "abstract" for artistic, conceptual, or background images. The generated image is shown to the user automatically — do not paste the URL into your reply.',
            inputSchema: z.object({
                ...cardTitleFields,
                caption: z.string().optional().describe('A short, fun, task-specific caption shown under the image on its card, e.g. "Neon launch banner for the spring sale" or "Friendly mascot for your onboarding emails". Describe THIS image for the user — do not use a generic label like "Generated image".'),
                prompt: z.string().describe('Detailed description of the image to generate. Include any exact text to render verbatim.'),
                style: z.enum(['realistic', 'graphic_text', 'brand_vector', 'abstract']).describe('The kind of image to produce'),
                aspectRatio: z.enum(['square', 'landscape', 'portrait']).optional().describe('Image orientation (default square)'),
            }),
            execute: async (toolInput, { toolCallId }: ToolExecutionOptions<undefined>) => withToolTimeout({
                toolName: 'ap_generate_image',
                timeoutMs: IMAGE_TIMEOUT_MS + 5_000,
                fn: async (signal) => {
                    const modelId = FAL_MODEL_BY_STYLE[toolInput.style]
                    const imageSize = FAL_IMAGE_SIZE_BY_ASPECT[toolInput.aspectRatio ?? 'square']
                    const { data: generated, error } = await tryCatch(() => generateImageWithFal({
                        modelId, imageSize, prompt: toolInput.prompt, apiKey: imageGeneration.apiKey, signal,
                    }))
                    if (error) {
                        return { content: [{ type: 'text', text: `Image generation failed: ${describeHttpError(error)}` }] }
                    }
                    const { data: saved, error: saveError } = await tryCatch(() => saveFile({
                        data: generated.bytes,
                        mediaType: generated.mediaType,
                        fileName: `generated-${toolCallId}.${generated.extension}`,
                    }))
                    if (saveError) {
                        return { content: [{ type: 'text', text: `Failed to store the generated image: ${saveError instanceof Error ? saveError.message : String(saveError)}` }] }
                    }
                    const timestamp = new Date().toISOString()
                    emitImage({
                        toolCallId,
                        fileId: saved.fileId,
                        url: saved.url,
                        mediaType: generated.mediaType,
                        prompt: toolInput.prompt,
                        model: modelId,
                        ...(toolInput.caption ? { caption: toolInput.caption } : {}),
                        timestamp,
                    })
                    return { success: true, fileId: saved.fileId, url: saved.url, mediaType: generated.mediaType, model: modelId, prompt: toolInput.prompt }
                },
            }),
        }),
    }
}

async function scrapeWithFirecrawl({ url, apiKey, signal }: { url: string, apiKey: string, signal: AbortSignal }): Promise<ScrapedPage> {
    const response = await safeHttp.axios.post('https://api.firecrawl.dev/v1/scrape', {
        url,
        formats: ['markdown'],
    }, {
        signal,
        timeout: SCRAPE_TIMEOUT_MS,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    })
    const body = isObject(response.data) ? response.data : {}
    const data = isObject(body['data']) ? body['data'] : {}
    return {
        markdown: typeof data['markdown'] === 'string' ? data['markdown'] : '',
        metadata: isObject(data['metadata']) ? data['metadata'] : {},
    }
}

async function scrapeWithApify({ url, apiKey, signal }: { url: string, apiKey: string, signal: AbortSignal }): Promise<ScrapedPage> {
    const response = await safeHttp.axios.post(`https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items?token=${encodeURIComponent(apiKey)}`, {
        startUrls: [{ url }],
        maxCrawlPages: 1,
        crawlerType: 'cheerio',
    }, {
        signal,
        timeout: SCRAPE_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
    })
    const items = Array.isArray(response.data) ? response.data : []
    const first = isObject(items[0]) ? items[0] : {}
    const markdown = typeof first['markdown'] === 'string'
        ? first['markdown']
        : (typeof first['text'] === 'string' ? first['text'] : '')
    return {
        markdown,
        metadata: isObject(first['metadata']) ? first['metadata'] : {},
    }
}

async function generateImageWithFal({ modelId, imageSize, prompt, apiKey, signal }: {
    modelId: string
    imageSize: string
    prompt: string
    apiKey: string
    signal: AbortSignal
}): Promise<GeneratedImage> {
    const response = await safeHttp.axios.post(`https://fal.run/${modelId}`, {
        prompt,
        image_size: imageSize,
        num_images: 1,
    }, {
        signal,
        timeout: IMAGE_TIMEOUT_MS,
        headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
    })
    const body = isObject(response.data) ? response.data : {}
    const images = Array.isArray(body['images']) ? body['images'] : []
    const first = isObject(images[0]) ? images[0] : {}
    const imageUrl = typeof first['url'] === 'string' ? first['url'] : ''
    if (!imageUrl) {
        throw new Error('The image provider returned no image.')
    }
    const mediaType = typeof first['content_type'] === 'string' ? first['content_type'] : 'image/png'
    const download = await safeHttp.axios.get<ArrayBuffer>(imageUrl, {
        signal,
        timeout: IMAGE_TIMEOUT_MS,
        responseType: 'arraybuffer',
        maxContentLength: 20 * 1024 * 1024,
        maxBodyLength: 20 * 1024 * 1024,
    })
    return {
        bytes: Buffer.from(download.data),
        mediaType,
        extension: mediaType.includes('jpeg') ? 'jpg' : (mediaType.split('/')[1] ?? 'png'),
    }
}

