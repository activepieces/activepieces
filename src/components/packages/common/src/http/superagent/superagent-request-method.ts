import type {SuperAgentRequest, Response} from 'superagent';

export type SuperAgentRequestMethod = (url: string, callback?: (err: any, res: Response) => void) => SuperAgentRequest;
