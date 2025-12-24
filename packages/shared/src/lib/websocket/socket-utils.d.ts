import { Socket } from 'socket.io-client';
export declare const emitWithAck: <T = unknown>(socket: Socket | undefined, event: string, data: unknown, options?: {
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
}) => Promise<T>;
