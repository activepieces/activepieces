import { AnalyticsResponseSchema, GetAnalyticsParams } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { analyticsService } from './analytics-service'

export const analyticsController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/',
        AnalyticsRequestParams,
        async (request, reply) => {
            try {
                const { startTimestamp, endTimestamp } = request.query

                // Convert timestamps to Date objects for comparison
                const start = new Date(startTimestamp)
                const end = new Date(endTimestamp)

                // Validate that startTimestamp comes before endTimestamp
                if (start >= end) {
                    return await reply.status(StatusCodes.BAD_REQUEST).send({
                        message: 'startTimestamp must be less than endTimestamp',
                    })
                }

                // Validate that startTimestamp and endTimestamp are valid dates
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return await reply.status(StatusCodes.BAD_REQUEST).send({
                        message: 'startTimestamp and endTimestamp must be a valid date ',
                    })
                }

                const analyticsData = await analyticsService.getAnalyticsData({
                    startTimestamp,
                    endTimestamp,
                })

                return await reply.send(analyticsData)
            }
            catch (error) {
                app.log.error(error)
                await reply.status(StatusCodes.INTERNAL_SERVER_ERROR).send({
                    message: 'An error occurred while fetching analytics data',
                })
            }
        },
    )
}


const errorResponseObj = { 
    type: 'object',
    properties: {
        message: { type: 'string' },
    }}

const AnalyticsRequestParams = {
    config: {},
    schema: {
        tags: ['analytics'],
        description: 'Get analytics data for flow-runs',
        querystring: GetAnalyticsParams, // Use shared DTO for query parameters
        response: {
            [StatusCodes.OK]: AnalyticsResponseSchema, // Use shared schema for response
            [StatusCodes.BAD_REQUEST]: errorResponseObj, // Allow any response structure for 400 Bad Request
            [StatusCodes.INTERNAL_SERVER_ERROR]: errorResponseObj, // Allow any response structure for 500 Internal Server Error
        }
        ,
    },
}


