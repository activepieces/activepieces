import { ExecutioOutputFile } from './execution/execution-output';
export declare const logSerializer: {
    serialize(log: ExecutioOutputFile): Promise<Buffer>;
};
