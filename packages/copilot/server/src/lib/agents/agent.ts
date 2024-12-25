import { Socket } from "socket.io";
import { PlanOptions } from "./planner";

export interface Agent<o> {
  plan(prompt: string, socket: Socket | null, options?: PlanOptions): Promise<o>;
}
