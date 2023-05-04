import { OpenAI } from 'langchain/llms/openai'
import { pieces } from '@activepieces/pieces-apps'
import { SequentialChain, LLMChain } from 'langchain/chains'
import { PromptTemplate } from 'langchain/prompts'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

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

function findTrigger() {
    const template = `I want you to suggest trigger for a flow in activepieces, I will provide list of possible triggers, I want you to reply with json that contains the trigger name and the piece name, do not write explanations, If you can't find a trigger, reply with empty object {}.
    ---
    Triggers:
    
    {allTriggers}
    -----

    Question: On new slack message, send me message on discord
    Answer: {"pieceName": "slack", "triggerName": "new_message"}
    
    Question: read rows from a sheet and only send email if the name is ahmad
    Answer: {"pieceName": "google-sheets", "triggerName": "new_row_added"}
    
    Question: read from discsord message and send email
    Answer: {}
    ---
    Question: {question}
    `
    return new LLMChain({
        llm,
        prompt: new PromptTemplate({
            template,
            inputVariables: ['allTriggers', 'question'],
        }),
        outputKey: 'trigger',
    })
}

function findActions() {
    const template = `I want you to suggest actions for a flow in activepieces, I will provide list of possible actions, I want you to reply with json array that contains the action name and the piece name, do not write explanations.
    ---
    Actions:
    
    {allActions}
    -----

    Question: On new slack message, send me message on discord
    Answer: [{"pieceName": "slack", "actionName": "send_message_webhook"}]
    
    Question: read rows from a sheet and only send email and disord message if the name is ahmad
    Answer: [{"pieceName": "gmail", "actionName": "send_email"}, {"pieceName": "slack", "actionName": "send_message_webhook"}]
    
    ---
    Question: {question}
    `
    return new LLMChain({
        llm,
        prompt: new PromptTemplate({
            template,
            inputVariables: ['allActions', 'question'],
        }),
        outputKey: 'actions',
    })
}

export async function findFlow(question: string){
    const overallChain = new SequentialChain({
        chains: [findTrigger(), findActions()],
        inputVariables: ['allActions', 'allTriggers', 'question'],
        outputVariables: ['actions', 'trigger'],
        verbose: true,
    })
    return await overallChain.call({
        allActions: getActionDetails(),
        allTriggers: getTriggerDetails(),
        question,
    })
}