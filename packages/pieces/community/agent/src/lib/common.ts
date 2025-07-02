import { httpClient, AuthenticationType, HttpMethod } from "@activepieces/pieces-common";
import { Agent, createAIProvider, SeekPage } from "@activepieces/shared"
import { openai } from "@ai-sdk/openai";


export const agentCommon = {
  async initializeOpenAIModel(params: InitOpenAI) {
    const baseURL = `${params.publicUrl}v1/ai-providers/proxy/openai`;
    const engineToken = params.token;
    return createAIProvider({
      providerName: 'openai',
      modelInstance: openai('gpt-4o-mini'),
      apiKey: engineToken,
      baseURL,
    });
  },
  listAgents(params: ListAgents) {
    return httpClient.sendRequest<SeekPage<Agent>>({
      method: HttpMethod.GET,
      url: `${params.publicUrl}v1/agents`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: params.token,
      },
    })
  },
  async getAgent(params: GetAgent) {
    const response = await httpClient.sendRequest<Agent>({
      method: HttpMethod.GET,
      url: `${params.publicUrl}v1/agents/${params.id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: params.token,
      },
    })
    return response.body
  }
}

type GetAgent = {
  publicUrl: string
  token: string
  id: string
}

type ListAgents = {
  publicUrl: string
  token: string
}

type InitOpenAI = {
  publicUrl: string
  token: string

}