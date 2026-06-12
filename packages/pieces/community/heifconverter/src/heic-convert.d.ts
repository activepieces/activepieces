//is essentially a declaration as heic-convert does have its own type in typescript

declare module 'heic-convert' {
    interface ConvertOptions {
        buffer: Buffer | ArrayBuffer;
        format: 'JPEG' | 'PNG';
        quality?: number;
    }

    function convert(options: ConvertOptions): Promise<ArrayBuffer>;

    export = convert;
}
