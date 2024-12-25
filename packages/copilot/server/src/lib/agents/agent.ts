import { Socket } from "socket.io";

export interface Agent<o> {
  plan(prompt: string, socket: Socket | null): Promise<o>;
}
