import { WebsocketChannelTypes, BaseAgentConfig, AgentCommand, TestRegistryCommand, GetTestRegistryResponse, WebsocketCopilotCommand, SystemUpdate, AgentCommandUpdate } from '@activepieces/copilot-shared'
import { Socket, io } from 'socket.io-client'
import { useWebSocketStore } from '../stores/use-websocket-store'
import { useAgentRegistryStore } from '../stores/use-agent-registry-store'
import { useTestRegistryStore } from '../stores/use-test-registry-store'

// Singleton socket instance
let socket: Socket | null = null

const setupEventListeners = (socketInstance: Socket) => {
  console.debug('Setting up WebSocket event listeners')

  socketInstance.on(WebsocketChannelTypes.UPDATE_RESULT, (data) => {
    console.debug('Received WebSocket result:', data)
    useWebSocketStore.getState().setResults(data)
  })

  socketInstance.on(WebsocketChannelTypes.SET_RESULT, (result) => {
    console.debug('Adding WebSocket result:', result)
    useWebSocketStore.getState().addResult(result)
    if (result.type === AgentCommandUpdate.AGENT_REGISTRY_UPDATED) {
      useAgentRegistryStore.getState().setAgents(result)
    }
  })
}

const connect = () => {
  if (!socket) {
    socket = io('http://localhost:3002', {
      transports: ['websocket'],
    })

    setupEventListeners(socket)
  }

  if (!socket.connected) {
    socket.connect()
    console.log('socket', !socket.connected)
    console.log('socket.type',WebsocketChannelTypes.GET_STATE)
    socket.emit(WebsocketChannelTypes.GET_STATE)
    requestAgentRegistry()
  }
}

const disconnect = () => {
  console.debug('Disconnecting from WebSocket')
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

const requestAgentRegistry = () => {
  console.debug('Requesting agent registry state')
  if (socket) {
    socket.emit(WebsocketChannelTypes.COMMAND, {
      command: AgentCommand.GET_AGENT_REGISTRY,
      data: {}
    })
  } else {
    console.warn('Cannot request agent registry: WebSocket not connected')
  }
}

const getSocket = (): Socket | null => {
  return socket
}

const sendCommand = async <T>(command: { type: WebsocketCopilotCommand; [key: string]: any }): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'))
      return
    }

    socket.emit(WebsocketChannelTypes.COMMAND, command, (response: T) => {
      resolve(response)
    })
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

export const websocketService = {
  connect,
  disconnect,
  requestAgentRegistry,
  getSocket,
  getTestRegistry,
} 