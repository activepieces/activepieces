import WebSocket from 'ws';
import { HulyWebSocketConnection } from '../types';

export class HulyWebSocketClient implements HulyWebSocketConnection {
  private socket: WebSocket | null = null;
  private requestMap = new Map<string, { resolve: Function; reject: Function }>();
  private url: string;
  private mockMode: boolean;
  
  constructor(url: string) {
    this.url = url;
    this.mockMode = url.startsWith('mock://');
  }

  public isConnected(): boolean {
    if (this.mockMode) {
      return true; // Always return true in mock mode
    }
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  public async connect(): Promise<void> {
    if (this.isConnected()) {
      return;
    }

    // If in mock mode, just simulate a successful connection
    if (this.mockMode) {
      console.log('Mock: Connected to Huly WebSocket');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url);

      this.socket.on('open', () => {
        console.log('Connected to Huly WebSocket');
        resolve();
      });

      this.socket.on('message', (data: WebSocket.Data) => {
        try {
          const response = JSON.parse(data.toString());
          
          if (response.id && this.requestMap.has(response.id)) {
            const { resolve } = this.requestMap.get(response.id)!;
            this.requestMap.delete(response.id);
            resolve(response);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.socket.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.socket.on('close', () => {
        console.log('Disconnected from Huly WebSocket');
        this.socket = null;
      });
    });
  }

  public disconnect(): void {
    if (this.mockMode) {
      console.log('Mock: Disconnected from Huly WebSocket');
      return;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public async send(message: any): Promise<any> {
    // In mock mode, we don't actually send anything through WebSocket
    if (this.mockMode) {
      console.log('Mock: Sending message:', message);
      // Just return a simulated successful response
      return {
        id: message.id || Date.now().toString(),
        result: { success: true }
      };
    }

    if (!this.isConnected()) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      // Generate a unique ID for this request
      const id = message.id || Date.now().toString();
      const requestWithId = { ...message, id };
      
      // Store the promise handlers
      this.requestMap.set(id, { resolve, reject });
      
      // Send the message
      this.socket!.send(JSON.stringify(requestWithId));
      
      // Set a timeout to clean up if no response
      setTimeout(() => {
        if (this.requestMap.has(id)) {
          this.requestMap.delete(id);
          reject(new Error('Request timed out'));
        }
      }, 30000); // 30 second timeout
    });
  }
}

// Create a singleton instance to be used throughout the application
let hulyClient: HulyWebSocketClient | null = null;

export function getHulyClient(url: string = 'wss://api.huly.io'): HulyWebSocketClient {
  if (!hulyClient) {
    hulyClient = new HulyWebSocketClient(url);
  }
  return hulyClient;
}