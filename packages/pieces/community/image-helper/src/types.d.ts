declare module 'node-exiftool' {
  export class ExiftoolProcess {
    open(): Promise<void>;
    writeMetadata(fileName: string, metadata: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
  }
}
