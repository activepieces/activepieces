import { XMLParser } from 'fast-xml-parser'
import { LLMResponseTextBlock, LLMResponseActionsBlock, LLMResponse } from './ai-agent'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '_text',
  isArray: (name) => ['apOperation'].includes(name),
})

const parseOperations = (xmlContent: string): LLMResponseActionsBlock => {
  const parsed = xmlParser.parse(xmlContent)
  const operations = parsed.apOperations.apOperation.map((operation: any) => {
    if (operation.type === 'createAction') {
      return {
        type: operation.type,
        displayName: operation.displayName,
        id: operation.id,
        inputs: operation.inputs || {},
        code: operation.code || ''
      }
    } 
    return operation
  })
  return {
    type: 'operations',
    operations
  }
}

export const llmMessageParser = {
  parse: (message: string): LLMResponse => {
    const operationsMatch = message.match(/<apOperations>[\s\S]*?<\/apOperations>/g)

    if (!operationsMatch) {
      return {
        blocks: [{
          type: 'text',
          text: message
        }]
      }
    }

    const blocks: (LLMResponseTextBlock | LLMResponseActionsBlock)[] = []
    let lastIndex = 0

    operationsMatch.forEach(match => {
      const startIndex = message.indexOf(match, lastIndex)

      // Add text before operation block if exists
      const textBefore = message.slice(lastIndex, startIndex).trim()
      if (textBefore) {
        blocks.push({
          type: 'text',
          text: textBefore
        })
      }

      // Add operation block
      blocks.push(parseOperations(match))

      lastIndex = startIndex + match.length
    })

    // Add remaining text if exists
    const remainingText = message.slice(lastIndex).trim()
    if (remainingText) {
      blocks.push({
        type: 'text',
        text: remainingText
      })
    }

    return { blocks }
  }
}