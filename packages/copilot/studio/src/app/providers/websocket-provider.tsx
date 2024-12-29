import { ReactNode, useEffect } from 'react'
import { websocketService } from '../services/websocket-service'

interface WebSocketProviderProps {
  children: ReactNode
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps): JSX.Element => {
  useEffect(() => {
    websocketService.connect()

    return () => {
      websocketService.disconnect()
    }
  }, [])

  return <>{children}</>
} 