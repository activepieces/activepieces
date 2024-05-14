import axios from 'axios'
import * as cheerio from 'cheerio'
import puppeteer from 'puppeteer'

type getTextContentParams = {
    url: string
}

const HTML_ELEMENTS_TO_EXECLUDE = 'nav,footer,script,style'

const CSR_DETECTION_CHARS_THRESHOLD = 500

export async function getTextContentFromUrl( { url }: getTextContentParams ): Promise<string> {
    let textContent = await getTextContentFromSSRWebsite({ url })
    if (textContent.trim().length < CSR_DETECTION_CHARS_THRESHOLD) {
        textContent = await getTextContentFromCSRWebsite({ url })
    }
    return textContent
}

export async function getTextContentFromSSRWebsite( { url }: getTextContentParams ): Promise<string> {
    const response = await axios.get(url)
    const html = response.data
    const cheerioInstance = cheerio.load(html)
    cheerioInstance(HTML_ELEMENTS_TO_EXECLUDE).remove()
    return cheerioInstance('body').text()
}

export async function getTextContentFromCSRWebsite( { url }: getTextContentParams ): Promise<string> {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url)
    const textContent = await page.evaluate(() => document.body.innerText)
    await browser.close()
    return textContent
}