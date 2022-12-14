import type {Response, SuperAgentRequest} from 'superagent';

export type SuperAgentRequestMethod = (url: string, callback?: (err: any, res: Response) => void) => SuperAgentRequest;
