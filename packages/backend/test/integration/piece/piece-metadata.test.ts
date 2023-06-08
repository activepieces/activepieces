import { FastifyError } from 'fastify'
import { app } from '../../../src/app/app'


jest.setTimeout(100000)

describe('Piece endpoints', () => {
    describe('List pieces metadata endpoint', () => {
        it('Requires a release query parameter', async () => {
            // act
            const response = await app.inject({
                method: 'GET',
                url: '/v1/pieces',
            })

            const body = response.json<FastifyError>()

            // assert
            expect(response.statusCode).toBe(400)
            expect(body.message).toBe('querystring must have required property \'release\'')
        })
    })
})
