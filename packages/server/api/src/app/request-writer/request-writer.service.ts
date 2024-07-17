import { AppSystemProp, CopilotInstanceTypes, logger, system } from '@activepieces/server-shared'
import { assertNotNullOrUndefined } from '@activepieces/shared'
import axios from 'axios'
import { JSDOM } from 'jsdom'
import OpenAI from 'openai'
import { ChatCompletionTool } from 'openai/resources'

const MAX_TOKENS = 128000
const CHARACTERS_PER_TOKEN = 3
const MAX_CHARACTERS = MAX_TOKENS * CHARACTERS_PER_TOKEN

function exceedsTokenLimit(text: string): boolean {
    return text.length > MAX_CHARACTERS
}

type RequestWriteParams = {
    prompt: string
}

async function fetchURLs(query: string): Promise<string[]> {
    const options = {
        headers: {
            'x-rapidapi-key': '552a5b1e9cmsh1dc41c8313814a4p15d790jsn5dadea6d32e8',
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
    const options = {
        headers: {
            'x-rapidapi-key': '8d460f8ef4msha149c58b6ca1fd9p1cbc49jsnce423baa386e',
            'x-rapidapi-host': 'html-to-gemtext-or-markdown.p.rapidapi.com',
            'Content-Type': 'application/json',
        },
    }
    
    const cleanedHtml = await cleanHtml(html)

    const { data } = await axios.post('https://html-to-gemtext-or-markdown.p.rapidapi.com/html2md/', { html: cleanedHtml }, options)

    return data?.result
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

export const requestWriterService = {
    customGPTPrompt: `We're building a something called http request writer based on user prompts.
    First I need to extract from the user prompt the following:
    1. Service Name: The service name that the user want to make an api request to, like: slack, taskade, hubspot, thriveCart, stripe 
    2. API Action: The http request itself like: post a message, list all products. 
    Based on the Service Name and the Action, return a ONLY search query (short, straightforward one) to find the api docs reference on google search, only return the text itself, no quotations, no introduction, always append the word 'api reference' to the query.
    `,

    async generateSearchQuery({ prompt }: RequestWriteParams): Promise<string> {
        const extractedSerchQuery = await getOpenAI().chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'system', content: prompt + ' \n ' + this.customGPTPrompt }],
            temperature: 0.2,
        })

        const searchQuery = extractedSerchQuery.choices[0].message.content as string

        const urls = await fetchURLs(searchQuery)
        logger.info(urls)
        const htmlResult = await Promise.all(urls.map((url) => axios.get(url)))

        const markdown = await HtmlToMd(htmlResult.map((res) => res.data).join(' '))
        
        if (exceedsTokenLimit(markdown)) {
            logger.error(`The provided text exceeds the maximum limit of ${MAX_CHARACTERS} characters for 128k tokens.`)
            return JSON.stringify({ 'method': 'ERROR',
                'body': '{"message":"The needed result exceeds the maximum limit of tokens of 128k"}',
            })
        }
        else {
            // User needs to perform a http request he enters this prompt: ${prompt}
            // Return the JSON object only, no intro, no any other text, no markdown.
            // { method: "", headers: {}, body: {}, baseURL: "" }
            // Note that baseURL can contains query params you can insert them like this: /{queryX}/create
            // IF QUERY EXISTS
            // DO NOT MISS any required body key or header.

            const URLToJSONPrompt = `
              Extract data from the current markdown after finding the best match of the data needed.
              Markdown:
              ${markdown}
              `
          
            // const extractedJsonRequest = await getOpenAI().chat.completions.create({
            //     model: 'gpt-4-turbo',
            //     messages: [{ role: 'user', content: URLToJSONPrompt }],
            //     temperature: 0.2,
            // })

            const extractedJsonRequest = await this.generateHttpRequest({ prompt: URLToJSONPrompt })
    
            logger.info(extractedJsonRequest)
            return extractedJsonRequest
        }
    },

    async generateHttpRequest({ prompt }: RequestWriteParams): Promise<string> {
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            tools: this.createCodeTools(),
            tool_choice: {
                type: 'function',
                function: {
                    name: 'http_request',
                },
            },
            temperature: 0.2,
        })
        assertNotNullOrUndefined(
            result.choices[0].message.tool_calls,
            'OpenAICodeResponse',
        )
        return result.choices[0].message.tool_calls[0].function.arguments
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
