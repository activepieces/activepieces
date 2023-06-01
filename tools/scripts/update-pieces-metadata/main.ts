import { generateMetadata } from './generate-metadata'
import { insertMetadata } from './insert-metadata'

const main = async () => {
    console.log('update pieces metadata: started')

    const piecesMetadata = await generateMetadata()
    await insertMetadata(piecesMetadata)

    console.log('update pieces metadata: completed')
}

main()
