import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { AIErrorResponse } from '@activepieces/common-ai'
import { agentCommon, AI_MODELS } from '../common';
import {  AgentOutputField, AgentPieceProps, AgentResult, AgentTaskStatus, assertNotNullOrUndefined, ContentBlockType, isNil, McpTool, ToolCallContentBlock, ToolCallStatus } from '@activepieces/shared';
import { APICallError, stepCountIs, streamText } from 'ai';

export const runAgent = createAction({
  name: 'run_agent',
  displayName: 'Run Agent',
  description: 'Run the AI assistant to complete your task.',
  auth: PieceAuth.None(),
  props: {
    [AgentPieceProps.PROMPT]: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe what you want the assistant to do.',
      required: true,
    }),
    [AgentPieceProps.AI_MODEL]: Property.StaticDropdown({
      displayName: 'AI Model',
      required: true,
      description: 'Choose your AI model and provider. Different models offer varying capabilities, speeds, and costs. OpenAI models are best for general tasks, Anthropic excels at analysis, and Google Gemini offers competitive pricing.',
      options: {
        options: AI_MODELS.map(model => ({
          label: `(${model.provider}) ${model.displayName}`,
          value: model.id,
        })),
      },
    }),
    [AgentPieceProps.AGENT_TOOLS]: Property.Array({
      displayName: 'MCP Tools',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Type',
          required: true
        }),
        toolName: Property.ShortText({
          displayName: 'Tool Name',
          required: true
        }),
        mcpId: Property.ShortText({
          displayName: 'Mcp Id',
          required: false
        }),
        pieceMetadata: Property.Json({
          displayName: 'Piece Metadata',
          required: false,
        }),
        flow: Property.Json({
          displayName: 'Populated Flow',
          required: false,
        }),
        flowId: Property.ShortText({
          displayName: 'Flow Id',
          required: false
        })
      }
    }),
    [AgentPieceProps.STRUCTURED_OUTPUT]: Property.Array({
      displayName: 'Structured Output',
      defaultValue: undefined,
      required: false,
      properties: {
        displayName: Property.ShortText({
          displayName: 'Display Name',
          required: true
        }),
        description: Property.ShortText({
          displayName: 'Description',
          required: false
        }),
        type: Property.ShortText({
          displayName: 'Type',
          required: true
        })
      }
    }),
    [AgentPieceProps.MAX_STEPS]: Property.Number({
      displayName: 'Max steps',
      description: 'The numbder of interations the agent can do',
      required: true,
      defaultValue: 20,
    }),
  },
  async run(context) {
    try {
      const { prompt, maxSteps, agentTools, structuredOutput, aiModel } = context.propsValue
      const { server } = context

      const result: AgentResult = {
        prompt,
        steps: [],
        status: AgentTaskStatus.IN_PROGRESS,
        message: null,
      }

    const commonParams = {
        apiUrl: context.server.apiUrl,
        token: server.token,
        flowId: context.flows.current.id,
        flowVersionId: context.flows.current.version.id,
        stepName: context.step.name
    }

    const agentToolInstance: Awaited<ReturnType<typeof agentCommon.agentTools>> = await agentCommon.agentTools({
        outputFields: structuredOutput as AgentOutputField[],
        tools: agentTools as McpTool[],
        ...commonParams
    })

    const selectedModel = agentCommon.getModelById(aiModel as string)
    const baseURL = `${server.apiUrl}v1/ai-providers/proxy/${selectedModel.provider}`
    const modelInstance = agentCommon.createModel({
      model: selectedModel,
      token: server.token,
      baseURL,
      flowId: context.flows.current.id,
    })
    
    const systemPrompt = agentCommon.constructSystemPrompt(prompt)
    const toolsMap = await agentToolInstance.tools()
    
    let fullStream
    try {
      fullStream = streamText({
        model: modelInstance,
        system: systemPrompt,
        prompt: prompt,
        stopWhen: stepCountIs(maxSteps),
        tools: toolsMap
      }).fullStream
    } catch (error) {
      result.status = AgentTaskStatus.FAILED
      result.message = `Failed to initialize stream: ${error instanceof Error ? error.message : JSON.stringify(error)}`
      context.output.update({ data: { ...result } })
      return result
    }

    let currentText = ''
    try {
        let chunkCount = 0
        let hasReceivedChunks = false
        
        // Process stream with timeout to catch hanging streams
        const processStream = async (): Promise<void> => {
            for await (const chunk of fullStream) {
                chunkCount++
                hasReceivedChunks = true
            
                if (chunk.type === 'text-delta') {
                    currentText += chunk.text
                }
                else if (chunk.type === 'tool-call') { 
                    if (currentText.length > 0) {
                        result.steps.push({
                            type: ContentBlockType.MARKDOWN,
                            markdown: currentText,
                        })
                        currentText = ''
                        context.output.update({ data: { 
                            ...result
                        }})
                    }
                    const metadata = agentCommon.getMetadata(chunk.toolName, agentTools as McpTool[], {
                        toolName: chunk.toolName,
                        toolCallId: chunk.toolCallId,
                        type: ContentBlockType.TOOL_CALL,
                        status: ToolCallStatus.IN_PROGRESS,
                        input: chunk.input as Record<string, unknown>,
                        output: undefined,
                        startTime: new Date().toISOString(),
                    })
                    result.steps.push(metadata)
                    context.output.update({ data: { 
                        ...result
                    }})
                }
                else if (chunk.type === 'tool-result') {
                    const lastBlockIndex = result.steps.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && block.toolCallId === chunk.toolCallId)
                    const lastBlock = result.steps[lastBlockIndex] as ToolCallContentBlock
                    assertNotNullOrUndefined(lastBlock, 'Last block must be a tool call')
                    result.steps[lastBlockIndex] = {
                        ...lastBlock,
                        status: ToolCallStatus.COMPLETED,
                        endTime: new Date().toISOString(),
                        output: chunk.output,
                    }
                    context.output.update({ data: { 
                        ...result
                    }})
                }
                else if (chunk.type === 'error') {
                    result.status = AgentTaskStatus.FAILED
                    if (APICallError.isInstance(chunk.error)) {
                        const errorResponse = (chunk.error as unknown as { data: AIErrorResponse })?.data
                        result.message = errorResponse?.error?.message ?? JSON.stringify(chunk.error)
                    }
                    else {
                        result.message = agentCommon.concatMarkdown(result.steps ?? []) + '\n' + JSON.stringify(chunk.error, null, 2)
                    }
                    context.output.update({ data: { 
                        ...result
                    }})
                    throw new Error(result.message)
                }
            }
            
            // If no chunks were received, this might indicate an issue
            if (!hasReceivedChunks) {
                throw new Error('No chunks received from AI model stream. The model may not have responded or the response was empty. This can happen if the AI SDK cannot process the response format from the model.')
            }
        }
        
        // Add timeout to catch hanging streams (60 seconds)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Stream processing timed out after 60 seconds. The AI model may not be responding, or the response format may be incompatible.'))
            }, 60000)
        })
        
        await Promise.race([processStream(), timeoutPromise])
    }
    catch (error) {
        result.status = AgentTaskStatus.FAILED
        
        // Extract clean error message from AI SDK errors
        let errorMessage = 'Unknown error occurred while processing agent stream'
        if (error instanceof Error) {
            // Check if it's an AI SDK retry error with nested errors
            const errorStr = error.message
            if (errorStr.includes('AI_RetryError') || errorStr.includes('AI_APICallError')) {
                try {
                    // Try to parse the error message to extract just the API error
                    const match = errorStr.match(/AI_APICallError[^}]*"message":\s*"([^"]+)"/)
                    if (match && match[1]) {
                        errorMessage = match[1]
                    } else {
                        // Extract status code if available
                        const statusMatch = errorStr.match(/"statusCode":\s*(\d+)/)
                        const statusCode = statusMatch ? statusMatch[1] : null
                        if (statusCode === '429') {
                            errorMessage = 'Rate limit exceeded. Please try again later.'
                        } else if (statusCode) {
                            errorMessage = `API error (status ${statusCode}). Please try again later.`
                        } else {
                            errorMessage = error.message.split('\n')[0] || 'API request failed. Please try again.'
                        }
                    }
                } catch {
                    // If parsing fails, use a simplified version of the error message
                    errorMessage = error.message.split('\n')[0] || 'API request failed. Please try again.'
                }
            } else {
                errorMessage = error.message
            }
        } else if (typeof error === 'string') {
            errorMessage = error
        }
        
        // Check if the task was actually completed before the error
        const markAsComplete = result.steps.find(agentCommon.isMarkAsComplete)
        if (markAsComplete && currentText.length > 0) {
            // Task completed but had a follow-up error (like rate limiting)
            // Still mark as failed but with a cleaner message
            result.message = `${agentCommon.concatMarkdown(result.steps)}\n\nNote: ${errorMessage}`
        } else {
            result.message = errorMessage || 'Agent execution failed. Please try again.'
        }
        
        context.output.update({ 
            data: { 
                ...result
            }
        })
        return result
    }

    if (currentText.length > 0) {
      result.steps.push({
          type: ContentBlockType.MARKDOWN,
          markdown: currentText,
      })
    }

    const markAsComplete = result.steps.find(agentCommon.isMarkAsComplete) as ToolCallContentBlock | undefined

    result.status = !isNil(markAsComplete) ? AgentTaskStatus.COMPLETED : AgentTaskStatus.FAILED
    result.message = agentCommon.concatMarkdown(result.steps)
    context.output.update({ data: { 
      ...result
    }})

    return result
    }
    catch (outerError) {
      // Catch any errors that happen outside the inner try-catch
      const errorResult: AgentResult = {
        prompt: context.propsValue?.prompt || '',
        steps: [],
        status: AgentTaskStatus.FAILED,
        message: outerError instanceof Error 
          ? `Unexpected error: ${outerError.message}${outerError.stack ? '\n' + outerError.stack : ''}`
          : JSON.stringify(outerError, null, 2),
      }
      context.output.update({ data: errorResult })
      return errorResult
    }
  }
});