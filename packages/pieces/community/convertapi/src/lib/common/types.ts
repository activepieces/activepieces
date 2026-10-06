export type ConvertApiFileRef = {
    Id: string;
};

export type ConvertApiParameter = {
    Name: string;
    Value?: string;
    FileValue?: ConvertApiFileRef;
    FileValues?: ConvertApiFileRef[];
};

export type ConvertApiUploadResponse = {
    FileId: string;
    FileName?: string;
    FileExt?: string;
    FileSize?: number;
    Url?: string;
};

export type ConvertApiResultFile = {
    FileName: string;
    FileExt?: string;
    FileSize?: number;
    FileId?: string;
    Url?: string;
    FileUrl?: string;
};

export type ConvertApiConversionResponse = {
    ConversionCost?: number;
    Files?: ConvertApiResultFile[];
};

export type ConvertApiErrorBody = {
    Code?: number;
    Message?: string;
};

export type ConverterParameter = {
    Name: string;
    Label?: string;
    Description?: string;
    Type: string;
    Required?: boolean;
    Array?: boolean;
    Default?: string | number | boolean | null;
    Values?: Record<string, string>;
    GroupName?: string;
};

export type ConverterParameterGroup = {
    Name: string;
    ConverterParameters: ConverterParameter[];
};

export type ConverterInfo = {
    Name: string;
    Title?: string;
    SourceFileFormats: string[];
    SourceExtensions?: string[];
    DestinationFileFormats: string[];
    DestinationExtensions?: string[];
    ConverterParameterGroups?: ConverterParameterGroup[];
};

export type InputFile = {
    filename: string;
    data: Buffer;
};

export type StoredFile = {
    file: string;
    file_name: string;
    file_extension: string | null;
    file_size: number | null;
};
