export interface ComponentOptionRequest {
    stepName: string;
    configName: string;
    config: Record<string, unknown>;
}

export const ComponentOptionRequestSchema = {
    body: {
        type: 'object',
        properties: {
            stepName: {type: 'string'},
            configName: {type: 'string'},
            config: {type: 'object'}
        },
        required: ['stepName', 'configName', 'config']
    }
}