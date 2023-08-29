import { Property, createAction } from '@activepieces/pieces-framework';
import { parseOfficeAsync } from 'officeparser';
import { getDocument} from 'pdfjs-dist';

export const nativeTextExtraction = createAction({
  name: 'native_text_extraction',
  description:
    'Extract text from many a file types (pdf, docx, pptx, xlsx, odt, odp, ods)',
  displayName: 'Native Extraction',
  props: {
    file: Property.LongText({
      displayName: 'Base64 File',
      description: 'The file to extract text from',
      required: true,
    }),
  },
  run: async ({ propsValue }) => {
    const file = propsValue.file;
    const MIMIEtype = file.split(';')[0].split(':')[1];

    if (MIMIEtype === 'application/pdf') {
      const doc = await getDocument({
        data: Buffer.from(file, 'base64').toString('binary'),
      }).promise;
      let extractText = ''

      for (let i = 0; i < doc.numPages; i++) {
        const extractedChunks = {} as {[y: number]: { x: number; text: string }[]}; 
        const textItems = (await (await doc.getPage(i)).getTextContent()).items
        let lastY: number | undefined
        for (const item of textItems) {
            if (!('str' in item)) continue
            
            const text = item.str
            const breakLine = item.hasEOL
            const x = item.transform[4] as number
            let y = item.transform[5] as number
            const h = item.height

            // check if there is a real break line
            // if the new chunk is upon or under (45% of the height if there a breakline specified and 100% else) the last chunk there is a break
            if (lastY && ((breakLine && !(y-h*0.45 > lastY || y+h*0.45 < lastY)) || !(y-h > lastY || y+h < lastY))) {
                y = lastY
            } else {
                lastY = y
            }

            if (extractedChunks[y]) {
                extractedChunks[y].push({ x, text })
            } else {
                extractedChunks[y] = [{ x, text }]
            }
        }

        for (const y in extractedChunks) {
            extractText += extractedChunks[y].sort((a, b) => a.x - b.x).map(chunk => chunk.text).join('') + '\n' 
        }

        lastY = undefined
        extractText += '\n'
      }

      return extractText
    } else {
        return await parseOfficeAsync(Buffer.from(file.split(',')[1], 'base64'))
    }
  },
});
