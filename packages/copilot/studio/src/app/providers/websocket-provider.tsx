import { ReactNode, useEffect } from 'react'
import { websocketService } from '../services/websocket-service'

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  console.debug('Rendering WebSocketProvider')

  useEffect(() => {
    websocketService.connect()

    return () => {
      websocketService.disconnect()
    }
  }, [])

  return <>{children}</>
} 