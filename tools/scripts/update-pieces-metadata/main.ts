import { generateMetadata } from './generate-metadata'
import { uploadMetadata } from './upload-metadata'

const main = async () => {
    console.log('update pieces metadata: started')

    const piecesMetadata = await generateMetadata()
    await uploadMetadata(piecesMetadata)

    console.log('update pieces metadata: completed')
}

main()
