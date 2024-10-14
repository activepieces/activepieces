import { createAction, Property } from '@activepieces/pieces-framework';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { nanoid } from 'nanoid';

const execPromise = promisify(exec);
const pdftoppmPath = '/usr/bin/pdftoppm';

const MAX_FILE_SIZE = 16 * 1024 * 1024;

async function isPdftoppmInstalled(): Promise<boolean> {
    const { stdout, stderr } = await execPromise(`command -v ${pdftoppmPath}`);
    return !stderr && stdout.trim() === pdftoppmPath;
}

async function convertPdfToImages(dataBuffer: Buffer): Promise<Buffer[]> {
    const tempDir = tmpdir();
    const uniqueId = nanoid();
    const inputFilePath = join(tempDir, `input-${uniqueId}.pdf`);
    const outputDir = join(tempDir, `output-${uniqueId}`);
    try {
        await fs.mkdir(outputDir);
        await fs.writeFile(inputFilePath, dataBuffer);

        const { stderr } = await execPromise(`${pdftoppmPath} -png ${inputFilePath} ${join(outputDir, 'output')}`);
        if (stderr) {
            throw new Error(stderr);
        }

        const files = await fs.readdir(outputDir);
        const imageBuffers = await Promise.all(
            files.map(async (file) => {
                const filePath = join(outputDir, file);
                const imageBuffer = await fs.readFile(filePath);
                await fs.unlink(filePath);
                return imageBuffer;
            })
        );

        return imageBuffers;
    } finally {
        await fs.unlink(inputFilePath);
        await fs.rmdir(outputDir);
    }
}

export const convertToImage = createAction({
    name: 'convertToImage',
    displayName: 'Convert to Image',
    description: 'Convert a PDF file or URL to an image',
    props: {
        file: Property.File({
            displayName: 'PDF File or URL',
            required: true,
        }),
    },
    errorHandlingOptions: {
        continueOnFailure: {
            defaultValue: false,
        },
        retryOnFailure: {
            hide: true
        },
    },
    async run(context) {
        if (!await isPdftoppmInstalled()) {
            throw new Error(`${pdftoppmPath} is not installed`);
        }

        const file = context.propsValue.file;
        // To prevent a DOS attack, we limit the file size to 16MB
        if (file.data.buffer.byteLength > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
        }

        const dataBuffer = Buffer.from(file.data.buffer);

        const imageBuffers = await convertPdfToImages(dataBuffer);
        const imageLinks = await Promise.all(imageBuffers.map((imageBuffer, index) =>
            context.files.write({
                data: imageBuffer,
                fileName: `converted_image_page_${index + 1}.png`,
            })
        ));

        return {
            images: imageLinks,
        };
    },
});
