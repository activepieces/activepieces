import { OpenAI } from 'langchain/llms/openai'
import { pieces } from '@activepieces/pieces-apps'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { jsonrepair } from 'jsonrepair'

const llm = new OpenAI({ openAIApiKey: system.get(SystemProp.OPENAI_KEY), temperature: 0.3 })

type TriggerDetails = {
    pieceName: string
    triggerName: string
    descsriptionName: string
}

type ActionDetails = {
    pieceName: string
    actionName: string
    descriptionName: string
}

function getActionDetails() {
    const context: ActionDetails[] = []
    for (const piece of pieces) {
        const actionKeys = Object.keys(piece.metadata().actions)
        for (const actionName of actionKeys) {
            const action = piece.metadata().actions[actionName]
            context.push({
                pieceName: piece.metadata().name,
                actionName: actionName,
                descriptionName: action.description,
            })
        }
    }
    return context
}

function getTriggerDetails() {
    const context: TriggerDetails[] = []
    for (const piece of pieces) {
        const triggerKeys = Object.keys(piece.metadata().triggers)
        for (const triggerName of triggerKeys) {
            const trigger = piece.metadata().triggers[triggerName]
            context.push({
                pieceName: piece.metadata().name,
                triggerName: triggerName,
                descsriptionName: trigger.description,
            })
        }
    }
    return context
}

async function findTrigger(prompt: string) {
    const template = `Provide a trigger for the activepieces flow using only the actions array provided. Your response must be a JSON object and should not include any additional information or explanations. If you are unable to find a suitable trigger, respond with an empty JSON object. Remember that you are only allowed to use the provided actions array and nothing else.
    ---
    Triggers Array:
    {allTriggers}
    -----
    {triggerExamples}
    ---
    Prompt: {prompt}
    `
    const chain = new LLMChain({
        llm,
        prompt: new PromptTemplate({
            template,
            inputVariables: ['allTriggers', 'prompt', 'triggerExamples'],
        }),
        outputKey: 'trigger',
    })
    const result = await chain.call({
        triggerExamples: `
        Prompt: On new slack message, send me message on discord
        Answer: {"pieceName": "slack", "triggerName": "new_message"}
        
        Prompt: read rows from a sheet and only send email if the name is ahmad
        Answer: {"pieceName": "google-sheets", "triggerName": "new_row_added"}
        
        Prompt: read from discsord message and send email
        Answer: {}
        `,
        prompt,
        allTriggers: JSON.stringify(getTriggerDetails()),

    })
    return extractJson(result.trigger)
}


async function findActions(prompt: string) {
    const template = `Provide actions for the activepieces flow using only the actions array provided. Your response should be a JSON array consisting of the action name and corresponding piece name. Do not include any explanations in your reply, You may disregard triggers that are included in the question and should not include them in your answer.
    ---
    Actions Array:
    {allActions}
    -----
    {actionExamples}
    ---
    Prompt: {prompt}
    Answer: 
    `
    const chain = new LLMChain({
        llm,
        prompt: new PromptTemplate({
            template,
            inputVariables: ['allActions', 'prompt', 'actionExamples'],
        }),
        outputKey: 'actions',
    })
    const result = await chain.call({
        allActions: JSON.stringify(getActionDetails()),
        actionExamples: `
        Prompt: On new slack message, send me message on discord
        Answer: [{"pieceName": "slack", "actionName": "send_message_webhook"}]
        
        Prompt: read rows from a sheet and only send email and disord message if the name is ahmad
        Answer: [{"pieceName": "gmail", "actionName": "send_email"}, {"pieceName": "slack", "actionName": "send_message_webhook"}]
        `,
        prompt,
    })
    return extractJson(result.actions)
}


function buildExamples(trigger: TriggerDetails, actions: ActionDetails[]) {
    const examples: string[] = [
        `
Prompt: Flow that runs when a webhook is called and sends an email if the number is greater than 17
Answer: {"type":"WEBHOOK","settings":{},"nextAction":{"type":"BRANCH","displayName":"Branch Greater 17","OnSuccessAction":{"type":"PIECE","settings":{"pieceName":"discord","actionName":"send_message_webhook"},"displayName":"Send Discord Message"}},"displayName":"Webhook Trigger"}
        
Prompt: Flow that Runs every 5 minutes
{"type":"PIECE_TRIGGER","settings":{"pieceName":"schedule","triggerName":"cron_expression", "input": {"cronExpression":"0/5 * * * *"} },"displayName":"Every 5 Min"}

Prompt: Flow that runs when a new message is posted on slack, it sends a message to discord and sends an email using gmail
Answer: {"type":"PIECE_TRIGGER","settings":{"pieceName":"slack","triggerName":"new_message"},"nextAction":{"type":"PIECE","settings":{"pieceName":"discord","actionName":"send_message_webhook"},"nextAction":{"type":"PIECE","settings":{"pieceName":"gmail","actionName":"send_email"},"displayName":"Send Email"},"displayName":"Send Discord Message"},"displayName":"New Slack Message"}

Prompt: Flow that runs when a webhook is called and sends an email if the number is greater than 17, else sends a message to discord, in both cases it sends a message to slack
Answer: {"type":"WEBHOOK","settings":{},"nextAction":{"type":"BRANCH","displayName":"Branch Greater 17","OnSuccessAction":{"type":"PIECE","settings":{"pieceName":"discord","actionName":"send_message_webhook"},"displayName":"Send Discord Message"},"onFailureAction":{"type":"PIECE","settings":{"pieceName":"gmail","actionName":"send_email"},"displayName":"Send Email"},"nextAction":{"type":"PIECE","settings":{"pieceName":"slack","actionName":"send_channel_message"},"displayName":"Send Slack Message"}},"displayName":"Webhook Trigger"}

Prompt: Flow that runs when a webhook is called and sends an email if the number is greater than 17
Answer: {"type":"WEBHOOK","settings":{},"nextAction":{"type":"BRANCH","displayName":"Branch Greater 17","OnSuccessAction":{"type":"PIECE","settings":{"pieceName":"discord","actionName":"send_message_webhook"},"displayName":"Send Discord Message"}},"displayName":"Webhook Trigger"}

        `,
    ]
    for (let i = 0; i < actions.length; ++i) {
        examples.push(`Prompt: on ${trigger.triggerName} do ${actions[i].actionName} \n Answer: {"type":"PIECE_TRIGGER","settings":{"pieceName":"${trigger.pieceName}","triggerName":"${trigger.triggerName}"},"nextAction":{"type":"PIECE","settings":{"pieceName":"${actions[i].pieceName}","actionName":"${actions[i].actionName}"}}}`)
    }
    return examples
}

async function generateFlow(trigger: TriggerDetails, actions: ActionDetails[], prompt: string) {
    const template = `
Your responsibility is to serve as a JSON generator for the activepieces flow by implementing the given flow description. You are to respond with the corresponding flow JSON enclosed within a single code block, without any additional information or explanation. It is essential that you do not create any properties values beyond the provided examples, and if you are unable to generate the flow, you should return an empty JSON object.
---
Examples:

{examples}

---
Prompt: {prompt}
Answer: 
`
    const examples = buildExamples(trigger, actions)
    const chain = new LLMChain({
        llm,
        prompt: new PromptTemplate({
            template,
            inputVariables: ['prompt', 'examples'],
        }),
        outputKey: 'flow',
    })
    const results = await chain.call({
        examples,
        prompt,
    })
    const flow = extractJson(results.flow)
    return {
        ...flow,
        settings: {
            ...trigger,
        },
    }
}

export async function findFlow(prompt: string) {
    const trigger = await findTrigger(prompt)
    const actions = await findActions(prompt)
    return {
        trigger: trigger,
        actions: actions,
        flow: await generateFlow(trigger, actions, prompt),
    }
}

function extractJson(text: string) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    const jsonStr = text.substring(start, end + 1)
    const jsonArray = JSON.parse(jsonrepair(jsonStr))
    return jsonArray
}
