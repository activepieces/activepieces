import { WebsocketChannelTypes, BaseAgentConfig, AgentCommand, TestRegistryCommand, GetTestRegistryResponse, WebsocketCopilotCommand, WebsocketCopilotResult, AgentCommandUpdate } from '@activepieces/copilot-shared'
import { Socket, io } from 'socket.io-client'
import { useWebSocketStore } from '../stores/use-websocket-store'
import { useAgentRegistryStore } from '../stores/use-agent-registry-store'
import { useTestRegistryStore } from '../stores/use-test-registry-store'

// Socket instance
let socket: Socket | null = null

// Event handlers
const handleAgentRegistryUpdate = (result: WebsocketCopilotResult): void => {
  if (result.type === AgentCommandUpdate.AGENT_REGISTRY_UPDATED) {
    const agentsMap = new Map(
      Object.entries(result.data).map(([name, config]) => [name, config as BaseAgentConfig])
    )
    useAgentRegistryStore.getState().setAgents(agentsMap)
  }
}

const handleWebSocketResult = (result: WebsocketCopilotResult): void => {
  useWebSocketStore.getState().addResult(result)
  handleAgentRegistryUpdate(result)
}

const setupEventListeners = (socketInstance: Socket): void => {
  socketInstance.on(WebsocketChannelTypes.UPDATE_RESULT, (data: WebsocketCopilotResult) => {
    useWebSocketStore.getState().setResults([data])
  })

  socketInstance.on(WebsocketChannelTypes.SET_RESULT, handleWebSocketResult)
}

// Socket management
const createSocket = (): Socket => {
  console.debug('[WebSocket] Creating new connection')
  const newSocket = io('http://localhost:3002', {
    transports: ['websocket'],
  })
  setupEventListeners(newSocket)
  return newSocket
}

const connect = (): void => {
  if (!socket) {
    socket = createSocket()
  }

  if (!socket.connected) {
    console.debug('[WebSocket] Connecting')
    socket.connect()
    socket.emit(WebsocketChannelTypes.GET_STATE)
    requestAgentRegistry()
  }
}

const disconnect = (): void => {
  console.debug('[WebSocket] Disconnecting')
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

const getSocket = (): Socket | null => socket

// Command handlers
const sendCommand = async <T>(command: { type: WebsocketCopilotCommand; [key: string]: any }): Promise<T> => {
  if (!socket) {
    throw new Error('[WebSocket] Socket not connected')
  }

  return new Promise((resolve) => {
    socket!.emit(WebsocketChannelTypes.COMMAND, command, (response: T) => {
      resolve(response)
    })
  })
}

const requestAgentRegistry = (): void => {
  console.debug('[WebSocket] Requesting agent registry')
  if (!socket) {
    console.warn('[WebSocket] Cannot request agent registry: Socket not connected')
    return
  }

  socket.emit(WebsocketChannelTypes.COMMAND, {
    command: AgentCommand.GET_AGENT_REGISTRY,
    data: {}
  })
}

const getTestRegistry = async (agentName: string) => {
  const response = await sendCommand<GetTestRegistryResponse>({
    type: TestRegistryCommand.GET_TEST_REGISTRY,
    agentName,
  })

  useTestRegistryStore.getState().setTestRegistry(response.data)
  return response.data
}

// Public API
export const websocketService = {
  connect,
  disconnect,
  requestAgentRegistry,
  getSocket,
  getTestRegistry,
  sendCommand,
} 