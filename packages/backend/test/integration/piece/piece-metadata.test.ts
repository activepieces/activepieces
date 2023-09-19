import { app } from '../../../src/app/app'


jest.setTimeout(100000)

describe('Piece endpoints', () => {
    describe('List pieces metadata endpoint', () => {
        // TODO fix this test and enable
        it('Allow to list without release parameter', async () => {
            // act
            const response = await app.inject({
                method: 'GET',
                url: '/v1/pieces',
            })

            // assert
            expect(response.statusCode).toBe(200)
        })
    })
})
