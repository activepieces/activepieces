export interface InstasentAuthType {
    apiKey: string;
    projectId: string;
    datasourceId: string;
}

export interface EventSpec {
    uid: string;
    name: string;
    description: string;
    category: string;
    attribution: boolean;
    automation: boolean;
    icon: string;
    emoji: string;
    important: boolean;
}

export interface EventParameter {
    parameter: string;
    title: string;
    description: string;
    icon: string;
    dataType: string;
    visualType: string;
    maxLength: number;
    required: boolean;
    multiValue: number;
}

export interface ContactAttributeSpec {
    uid: string;
    displayLabel: string;
    description: string;
    dataType: string;
    multivalue: number;
    readOnly: boolean;
    requiredInWebhook: boolean;
    important: boolean;
    visible: boolean;
    custom: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    entitiesSuccess: number;
    streamId: string;
    projectId: string;
    datasourceId: string;
    errors: any[];
    accepted: Array<{
        position: number;
        item: T;
    }>;
}
