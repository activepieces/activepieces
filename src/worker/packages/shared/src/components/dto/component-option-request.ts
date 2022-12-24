export interface ComponentOptionRequest {
    stepName: string;
    configName: string;
    configs: Record<string, unknown>;
}

export const ComponentOptionRequestSchema = {
    body: {
        type: 'object',
        properties: {
            stepName: {type: 'string'},
            configName: {type: 'string'},
            configs: {type: 'object'}
        },
        required: ['stepName', 'configName', 'configs']
    }
}