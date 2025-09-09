export interface CloudConvertTask {
  id: string;
  name: string;
  status: string;
  operation: string;
  message?: string | null;
  result?: {
    form?: {
      url: string;
      parameters: Record<string, string>;
    };
    files?: {
      filename: string;
      url: string;
      size: number;
    }[];
  };
}

export interface CloudConvertJob {
  id: string;
  status: string;
  tasks: CloudConvertTask[];
}
