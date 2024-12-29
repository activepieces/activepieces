import { WebsocketChannelTypes, BaseAgentConfig, AgentCommand } from '@activepieces/copilot-shared'
import { Socket, io } from 'socket.io-client'
import { useWebSocketStore } from '../stores/use-websocket-store'
import { useAgentRegistryStore } from '../stores/use-agent-registry-store'

class WebSocketService {
  private socket: Socket | null = null
  private static instance: WebSocketService | null = null

  private constructor() {
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService()
    }
    return WebSocketService.instance
  }

  public connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:3002', {
        transports: ['websocket'],
      })

      this.setupEventListeners()
    }

    if (!this.socket.connected) {
      this.socket.connect()
      this.socket.emit(WebsocketChannelTypes.GET_STATE)
      // Request agent registry state on initial connection
      this.requestAgentRegistry()
    }
  }

  public disconnect() {
    console.debug('Disconnecting from WebSocket')
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  public requestAgentRegistry() {
    console.debug('Requesting agent registry state')
    if (this.socket) {
      this.socket.emit('message', {
        command: AgentCommand.GET_AGENT_REGISTRY,
        data: {}
      })
    } else {
      console.warn('Cannot request agent registry: WebSocket not connected')
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on(WebsocketChannelTypes.RESPONSE_GET_STATE, (data) => {
      useWebSocketStore.getState().setResults(data)
    })

    this.socket.on(WebsocketChannelTypes.UPDATE_RESULTS, (result) => {
      useWebSocketStore.getState().addResult(result)
    })

    this.socket.on(WebsocketChannelTypes.RESPONSE_GET_AGENT_REGISTRY, (data: Record<string, BaseAgentConfig>) => {
      console.debug('Received agent registry state:', data)
      const agentsMap = new Map(Object.entries(data))
      useAgentRegistryStore.getState().setAgents(agentsMap)
    })

    this.socket.on(WebsocketChannelTypes.UPDATE_AGENT_REGISTRY, (data: Record<string, BaseAgentConfig>) => {
      console.debug('Received agent registry update:', data)
      const agentsMap = new Map(Object.entries(data))
      useAgentRegistryStore.getState().setAgents(agentsMap)
    })
  }

  public getSocket(): Socket | null {
    return this.socket
  }
}

export const websocketService = WebSocketService.getInstance() 