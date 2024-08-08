import { AppSystemProp, CopilotInstanceTypes, logger, system } from '@activepieces/server-shared'
import { assertNotNullOrUndefined } from '@activepieces/shared'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import OpenAI from 'openai'
import { ChatCompletionTool } from 'openai/resources'
import TurndownService from 'turndown'

const MAX_TOKENS = 128000
const CHARACTERS_PER_TOKEN = 3
const MAX_CHARACTERS = MAX_TOKENS * CHARACTERS_PER_TOKEN

type RequestWriteParams = {
    prompt: string
}

function exceedsTokenLimit(text: string): boolean {
    return text.length > MAX_CHARACTERS
}

function getOpenAI(): OpenAI {
    let openai
    const apiKey = system.getOrThrow(AppSystemProp.OPENAI_API_KEY)
    const openaiInstanceType = system.getOrThrow<CopilotInstanceTypes>(AppSystemProp.COPILOT_INSTANCE_TYPE)

    switch (openaiInstanceType) {
        case CopilotInstanceTypes.AZURE_OPENAI: {
            const apiVersion = system.getOrThrow(AppSystemProp.AZURE_OPENAI_API_VERSION)
            openai = new OpenAI({
                apiKey,
                baseURL: system.getOrThrow(AppSystemProp.AZURE_OPENAI_ENDPOINT),
                defaultQuery: { 'api-version': apiVersion },
                defaultHeaders: { 'api-key': apiKey },
            })
            break
        }
        case CopilotInstanceTypes.OPENAI: {
            openai = new OpenAI({
                apiKey,
                baseURL: system.get(AppSystemProp.OPENAI_API_BASE_URL),
            })
            break
        }
    }
    return openai
}

async function fetchURLs(query: string): Promise<string[]> {
    const options = {
        headers: {
            'x-rapidapi-key': system.getOrThrow(AppSystemProp.RAPID_API_KEY),
            'x-rapidapi-host': 'google-api31.p.rapidapi.com',
            'Content-Type': 'application/json',
        },
    }    
    
    const body = {
        text: query,
        safesearch: 'off',
        region: 'wt-wt',
        timelimit: '',
        max_results: 3,
    }
    
    const response = await axios.post('https://google-api31.p.rapidapi.com/websearch', body, options)
    return response.data?.result?.map((url: { href: string }) => url.href)
}

async function cleanHtml(html: string): Promise<string> {
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Remove unnecessary tags
    const tagsToRemove = ['script', 'style', 'footer', 'header', 'nav', 'aside']
    tagsToRemove.forEach(tag => {
        const elements = document.querySelectorAll(tag)
        elements.forEach((el) => el.remove())
    })

    // Extract relevant sections
    const relevantSections = ['h1', 'h2', 'h3', 'h4', 'p', 'pre', 'code', 'table']
    let cleanedHtml = ''
    relevantSections.forEach(tag => {
        const elements = document.querySelectorAll(tag)
        elements.forEach((el) => cleanedHtml += el.outerHTML)
    })

    return cleanedHtml
}

async function HtmlToMd(html: string): Promise<string>  {
    try {
        const cleanedHtml = await cleanHtml(html)
        const turndownService = new TurndownService()
        const markdown = turndownService.turndown(cleanedHtml)
        return markdown
    }
    catch (error) {
        logger.error('Error converting HTML to Markdown:', error)        
        throw new Error('Failed to convert HTML to Markdown')
    }
}
const customGPTPrompt = `We're building a something called http request writer based on user prompts.
    First I need to extract from the user prompt the following:
    1. Service Name: The service name that the user want to make an api request to, like: slack, taskade, hubspot, thriveCart, stripe 
    2. API Action: The http request itself like: post a message, list all products. 
    Based on the Service Name and the Action, return an ONLY search query (short, straightforward one) to find the api docs reference on google search, only return the text itself, no quotations, no introduction, always append the word 'api reference' to the query.
    `
export const requestWriterService = {

    async generateSearchQuery({ prompt }: RequestWriteParams): Promise<string> {
        const openAI = getOpenAI()
        const extractedSearchQuery = await openAI.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: customGPTPrompt }, { role: 'user', content: prompt }],
            temperature: 0.2,
        })
        assertNotNullOrUndefined(
            extractedSearchQuery.choices[0].message.content,
            'OpenAICodeResponse',
        )
        const searchQuery = extractedSearchQuery.choices[0].message.content.trim() as string
        return searchQuery
    },

    async fetchAndProcessURLs(searchQuery: string): Promise<string[]> {
        const urls = await fetchURLs(searchQuery)
        const htmlResults = await Promise.all(urls.map((url) => axios.get(url, { headers: { Accept: '*/*' } })))
        const markdownResults = await Promise.all(htmlResults.map((res) => HtmlToMd(res.data)))
        return markdownResults
    },

    async generateHttpRequest({ prompt }: RequestWriteParams): Promise<string> {
        const openAI = getOpenAI()
        const completion = await openAI.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        })

        assertNotNullOrUndefined(
            completion?.choices[0]?.message?.content,
            'OpenAICodeResponse',
        )

        const extractedJsonRequest = completion.choices[0].message.content.trim() as string
        return extractedJsonRequest
    },

    async createRequest({ prompt }: RequestWriteParams): Promise<string> {
        const searchQuery = await this.generateSearchQuery({ prompt })
        const markdownResults = await this.fetchAndProcessURLs(searchQuery)

        const apiReferencePrompt = `Based on the service and action, find the appropriate API documentation and provide the HTTP request details. 
        Use the following markdown extracted from the API references:
        ${markdownResults.join('\n')}

        Use this structure to return the HTTP request details from the previous markdown:
        {
            "method": "HTTP_METHOD",
            "url": "API_ENDPOINT",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": "Bearer YOUR_API_KEY",
                ...other_requried_headers
            },
            "body": { ... },
            "queryParams": { ... }
        }

        Return only the JSON object without any text in the conversation response, no intro, no markdown.
        `

        if (exceedsTokenLimit(apiReferencePrompt)) {
            return JSON.stringify({ 'error': 'true',
                'body': '{"message":"The needed result exceeds the maximum limit of tokens of 128k"}',
            })
        }

        const httpRequestDetails = await this.generateHttpRequest({ prompt: apiReferencePrompt })
        return httpRequestDetails
    },

    createCodeTools(): ChatCompletionTool[] {
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'http_request',
                    description: `Generates a JSON object from the following markdown of a service api reference.
                    Make sure that the queryParams, body and headers are all valid JSON strings, if not needed, leave them empty.
                    `,
                    parameters: {
                        type: 'object',
                        properties: {
                            method: { type: 'string' },
                            url: { type: 'string' },
                            queryParams: { 
                                type: 'string',
                            },
                            body: { 
                                type: 'string',
                            },
                            headers: {
                                type: 'string',
                            },
                        },
                        required: ['method', 'url'],
                    },
                },
            },
        ]

        return tools as ChatCompletionTool[]
    },
}
