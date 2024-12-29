import { WebsocketEventTypes } from '@activepieces/copilot-shared'
import { Socket, io } from 'socket.io-client'
import { useWebSocketStore } from '../stores/use-websocket-store'

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
      this.socket.emit(WebsocketEventTypes.GET_STATE)
    }
  }

  public disconnect() {
    console.debug('Disconnecting from WebSocket')
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  private setupEventListeners() {
    if (!this.socket) return

      this.socket.on(WebsocketEventTypes.RESPONSE_GET_STATE, (data) => {
        useWebSocketStore.getState().setResults(data)
      })

    this.socket.on(WebsocketEventTypes.UPDATE_RESULTS, (result) => {
      useWebSocketStore.getState().addResult(result)
    })
  }

  public getSocket(): Socket | null {
    return this.socket
  }
}

export const websocketService = WebSocketService.getInstance() 