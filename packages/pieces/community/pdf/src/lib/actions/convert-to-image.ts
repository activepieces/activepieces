import { createAction, Property } from '@activepieces/pieces-framework';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { nanoid } from 'nanoid';
import Jimp from 'jimp';

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
        const imageBuffers = [];
        for (const file of files) {
            const filePath = join(outputDir, file);
            const imageBuffer = await fs.readFile(filePath);
            await fs.unlink(filePath);
            imageBuffers.push(imageBuffer);
        }

        return imageBuffers;
    } finally {
        await fs.unlink(inputFilePath).catch(() => void 0);
        await fs.rm(outputDir, { recursive: true, force: true }).catch(() => void 0);
    }
}

async function concatImagesVertically(imageBuffers: Buffer[]): Promise<Buffer> {
    const images = await Promise.all(imageBuffers.map(buffer => Jimp.read(buffer)));
    const totalHeight = images.reduce((sum, image) => sum + image.getHeight(), 0);
    const maxWidth = Math.max(...images.map(image => image.getWidth()));

    const finalImage = new Jimp(maxWidth, totalHeight);
    let yOffset = 0;

    for (const image of images) {
        finalImage.composite(image, 0, yOffset);
        yOffset += image.getHeight();
    }

    return finalImage.getBufferAsync(Jimp.MIME_PNG);
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
        imageOutputType: Property.StaticDropdown({
            displayName: 'Output Image Type',
            required: true,
            options: {
                options: [
                    { label: 'Single Combined Image', value: 'single' },
                    { label: 'Separate Image for Each Page', value: 'multiple' },
                ],
            },
            defaultValue: 'multiple',
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
        const returnConcatenatedImage = context.propsValue.imageOutputType === 'single';
        // To prevent a DOS attack, we limit the file size to 16MB
        if (file.data.buffer.byteLength > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
        }

        const dataBuffer = Buffer.from(file.data.buffer);

        const imageBuffers = await convertPdfToImages(dataBuffer);

        if (returnConcatenatedImage) {
            const finalImageBuffer = await concatImagesVertically(imageBuffers);
            const imageLink = await context.files.write({
                data: finalImageBuffer,
                fileName: `converted_image.png`,
            });

            return {
                image: imageLink,
            };
        } else {
            const imageLinks = await Promise.all(imageBuffers.map((imageBuffer, index) =>
                context.files.write({
                    data: imageBuffer,
                    fileName: `converted_image_page_${index + 1}.png`,
                })
            ));

            return {
                images: imageLinks,
            };
        }
    },
});
