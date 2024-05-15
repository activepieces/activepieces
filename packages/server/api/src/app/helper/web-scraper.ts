import axios from 'axios'
import * as cheerio from 'cheerio'

type getTextContentParams = {
    url: string
}

const HTML_ELEMENTS_TO_EXECLUDE = 'nav,footer,script,style'

export async function getTextContentFromUrl( { url }: getTextContentParams ): Promise<string> {
    const response = await axios.get(url)
    const html = response.data
    const cheerioInstance = cheerio.load(html)
    cheerioInstance(HTML_ELEMENTS_TO_EXECLUDE).remove()
    return cheerioInstance('body').text()
}