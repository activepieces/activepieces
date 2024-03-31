import { ConversationChain } from 'langchain/chains'
import { ChatOpenAI } from '@langchain/openai'

const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY

const llm = new ChatOpenAI({
    openAIApiKey: OPEN_AI_API_KEY,
})

const bot = new ConversationChain({
    llm,
})

const propsPrompt = `The following JavaScript DSL is used to represent props of an HTTP API endpoint:

\`\`\`js
/**
 * The short text property is used to store text values that are less than or equal to 255 characters.
 */
Property.ShortText({
  /**
   *  A human-readable name for the property.
   *  @type {string}
   */
  displayName: 'Short Text',
  /**
   * A human-readable description of the property.
   */
  description: 'Short text description',
  /**
   * Whether the property is required or not.
   */
  required: false,
})

/**
 * The long text property is used to store text values that are more than 255 characters.
 */
Property.LongText({
  /**
   * A human-readable name for the property.
   */
  displayName: 'Long Text',
  /**
   * A human-readable description of the property.
   */
  description: 'Long text description',
  /**
   * Whether the property is required or not.
   */
  required: false,
})

/**
 * The Checkbox property is used to store boolean values.
 */
Property.Checkbox({
  /**
   * A human-readable name for the property.
   */
  displayName: 'Checkbox',
  /**
   * A human-readable description of the property.
   */
  description: 'Checkbox description',
  /**
   * Whether the property is required or not.
   */
  required: false,
})

/**
 * The Number property is used to store numerical values.
 */
Property.Number({
  /**
   * A human-readable name for the property.
   */
  displayName: 'Number',
  /**
   * A human-readable description of the property.
   */
  description: 'Number description',
  /**
   * Whether the property is required or not.
   */
  required: false,
})
\`\`\`

Replace the values in the \`props\` object with the appropriate Property from the given JavaScript DSL. Return the \`props\`
definition only in your response without \`const props = \`, only the object definition literal without variable declaration.
Remove all code comments from your response.`

const runPrompt = `Implement the API call in the \`run\` function, where \`propsValue\` contains the actual values of the \`props\` object.
Use the Fetch API to make HTTP requests. Write declarative code without comments.

\`\`\`js
async run({ propsValue }) {

}
\`\`\`

Return the function literal only in your response.`

export const generateAction = async (apiEndpoint: string): Promise<GeneratedAction> => {
    await bot.invoke({ input: `
    Define the props of an HTTP API endpoint as the inputs that need to be provided by the API client to make the
    HTTP request, according to the provided definition, build a JavaScript object named \`props\` where keys are prop names
    and values are prop descriptions for the ${apiEndpoint}.
    ` })

    const props = await bot.invoke({ input: propsPrompt })
    const run = await bot.invoke({ input: runPrompt })

    return {
        props: props.response,
        run: run.response,
    }
}

export type GeneratedAction = {
    props: string
    run: string
}
