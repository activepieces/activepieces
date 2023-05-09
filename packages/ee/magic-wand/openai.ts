import { OpenAI } from 'langchain/llms/openai'
import { getPiece, pieces } from '@activepieces/pieces-apps'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import { system } from '@backend/helper/system/system'
import { SystemProp } from '@backend/helper/system/system-prop'
import { jsonrepair } from 'jsonrepair'
import { Action, ActionType, BranchAction, CodeAction, PieceAction, Trigger, TriggerType } from '@activepieces/shared'
import { logger } from '@backend/helper/logger'
import { isNil } from 'lodash'


const llm =  !system.get(SystemProp.OPENAI_KEY)? undefined :  new OpenAI({ openAIApiKey: system.get(SystemProp.OPENAI_KEY), temperature: 0.2, modelName: 'gpt-3.5-turbo' })

type TriggerDetails = {
    pieceName: string
    triggerName: string
    displayName: string
    description: string
}

type ActionDetails = {
    pieceName: string
    actionName: string
    displayName: string
    description: string
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
                displayName: action.displayName,
                description: action.description,
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
                displayName: trigger.displayName,
                description: trigger.description,
            })
        }
    }
    return context
}

async function findTrigger(prompt: string): Promise<TriggerDetails> {
    const template = `Provide a trigger for the activepieces flow using only the actions array provided. Your response must be a JSON object and should not include any additional information or explanations. If you are unable to find a suitable trigger, respond with an empty JSON object. Remember that you are only allowed to use the provided actions array and nothing else.
    ---
    Triggers Array:
    {allTriggers}
    -----
    {triggerExamples}
    ---
    Prompt: {prompt}
    `
    if(llm){
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
        try {
            return extractJson(result.trigger)
        }
        catch (e) {
            logger.warn('Failed to extract trigger', e)
            // TODO change to default trigger
            return {
                pieceName: 'schedule',
                triggerName: 'cron_expression',
                displayName: 'Failed to extract trigger',
                description: 'Runs every 5 minutes',
            }
        }
      
    }
    logger.error('llm is uninitailized');
    // TODO change to default trigger
    return {
        pieceName: 'schedule',
        triggerName: 'cron_expression',
        displayName: 'llm is uninitailized',
        description: 'Runs every 5 minutes',
    }
  
}


async function findActions(prompt: string): Promise<ActionDetails[]> {
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
    if(llm)
    {
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
        try {
            return extractJson(result.actions)
        }
        catch (e) {
            logger.warn('Failed to extract actions', e)
            return []
        }
    }
    logger.error('llm is uninitailized');
    return [];
   
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
        examples.push(`Prompt: on ${trigger.triggerName} do ${actions[i].actionName} \n Answer: {"type":"PIECE_TRIGGER", 'displayName": "${trigger.displayName}" ,"settings":{"pieceName":"${trigger.pieceName}","triggerName":"${trigger.triggerName}"},"nextAction":{"type":"PIECE","settings":{"pieceName":"${actions[i].pieceName}","actionName":"${actions[i].actionName}", "displayName": "${actions[i].displayName}"}}}`)
    }
    return examples
}

async function generateTrigger(trigger: TriggerDetails, actions: ActionDetails[], prompt: string) {
    const template = `
Your responsibility is to serve as a JSON generator for the activepieces flow by implementing the given flow description. You are to respond with the corresponding flow JSON enclosed within a single code block, without any additional information or explanation. and are only authorized to use "PIECE" or "BRANCH" as action types. BRANCH action can have onSuccessAction, onFailureAction and nextAction properties, failure to comply with these guidelines will result in failure.
---
Examples:

{examples}

---
Prompt: {prompt}
Answer: 
`
    const examples = buildExamples(trigger, actions)
    if(llm)
    {
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
        logger.info(results.flow)
        const flow = extractJson(results.flow)
        // Override the settings, since we already have them
        if (flow.type === TriggerType.PIECE) {
            flow.settings = trigger
        }
        logger.info('Prompt ' + prompt)
        logger.info('GENERATED RESPONSE ' + JSON.stringify(flow))
        return flow  
    }

}

export async function generateFlow(prompt: string): Promise<Trigger> {
    const trigger = await findTrigger(prompt)
    const actions = await findActions(prompt)
    logger.info('Found trigger ' + JSON.stringify(trigger))
    logger.info('Found actions ' + JSON.stringify(actions))
    return validateTrigger(await generateTrigger(trigger, actions, prompt))
}

function extractJson(text: string) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    const jsonStr = text.substring(start, end + 1)
    const jsonArray = JSON.parse(jsonrepair(jsonStr))
    return jsonArray
}

const HELLO_WORLD_CODE_ARTIFACT_BASE64 = 'UEsDBAoAAAAAAIGZWlYSIpQ2PAAAADwAAAAIAAAAaW5kZXgudHNleHBvcnQgY29uc3QgY29kZSA9IGFzeW5jIChwYXJhbXMpID0+IHsKICAgIHJldHVybiB0cnVlOwp9OwpQSwMECgAAAAAAgZlaVhpS0QgcAAAAHAAAAAwAAABwYWNrYWdlLmpzb257CiAgImRlcGVuZGVuY2llcyI6IHsKICB9Cn0KUEsBAhQACgAAAAAAgZlaVhIilDY8AAAAPAAAAAgAAAAAAAAAAAAAAAAAAAAAAGluZGV4LnRzUEsBAhQACgAAAAAAgZlaVhpS0QgcAAAAHAAAAAwAAAAAAAAAAAAAAAAAYgAAAHBhY2thZ2UuanNvblBLBQYAAAAAAgACAHAAAACoAAAAAAA='

function cleanAction(step: Action | undefined, count: number): Action | undefined {
    if (isNil(step)) {
        return undefined
    }
    const basicStep = {
        name: 'step-' + count,
        displayName: step.displayName ?? 'Untitled Step',
        type: step.type,
        valid: false,
        nextAction: cleanAction(step.nextAction, 3 * count),
    }
    switch (basicStep.type) {
        case ActionType.BRANCH: {
            const branch: BranchAction = step as BranchAction
            const failureAction = branch?.onFailureAction
            const successAction = branch?.onSuccessAction
            const action: BranchAction = {
                ...basicStep,
                type: ActionType.BRANCH,
                settings: {
                    // TODO support this in the prompt
                    conditions: [[{
                        firstValue: '',
                        secondValue: '',
                    }]],
                },
                onFailureAction: cleanAction(failureAction, 3 * count + 1),
                onSuccessAction: cleanAction(successAction, 3 * count + 2),
            }
            return action
        }
        case ActionType.PIECE: {
            const pieceAction: PieceAction = step as PieceAction
            const piece = pieceAction?.settings.pieceName ? getPiece(pieceAction?.settings?.pieceName) : undefined
            const actionStep = pieceAction?.settings.actionName ? piece?.getAction(pieceAction?.settings?.actionName) : undefined
            if (!piece || !actionStep) {
                const action: CodeAction = {
                    ...basicStep,
                    type: ActionType.CODE,
                    settings: {
                        input: {},
                        artifact: HELLO_WORLD_CODE_ARTIFACT_BASE64,
                    },
                }
                return action
            }
            const action: PieceAction = {
                ...basicStep,
                displayName: actionStep.displayName,
                type: ActionType.PIECE,
                settings: {
                    pieceName: piece.name,
                    pieceVersion: piece.version,
                    input: {},
                    inputUiInfo: {},
                    actionName: actionStep.name,
                },
            }
            return action
        }
        default:
            throw new Error(`Unknown Action type ${step.type}`)
    }
}

function validateTrigger(step: Trigger): Trigger {
    const basicStep = {
        name: 'trigger',
        displayName: step.displayName ?? 'Untitled Trigger',
        type: step.type,
        nextAction: cleanAction(step.nextAction, 1),
        valid: false,
    }
    switch (step.type) {
        case TriggerType.PIECE: {
            const piece = step?.settings?.pieceName ? getPiece(step.settings.pieceName) : undefined
            const triggerStep = step?.settings?.triggerName ? piece?.getTrigger(step.settings.triggerName) : undefined
            // TODO return default action
            if (!piece || !triggerStep) {
                return {
                    ...basicStep,
                    type: TriggerType.WEBHOOK,
                    settings: {},
                } as Trigger
            }
            return {
                ...basicStep,
                settings: {
                    pieceName: step.settings.pieceName,
                    triggerName: step.settings.triggerName,
                    pieceVersion: piece.version,
                    input: {},
                },
            } as Trigger
        }
        case TriggerType.WEBHOOK:
        default:
            return {
                ...basicStep,
                type: TriggerType.WEBHOOK,
                settings: {},
            } as Trigger
    }
}
