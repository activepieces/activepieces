import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema } from '../../common'

export const UserBadge = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    userId: Type.String(),
   
})

export type UserBadge = Static<typeof UserBadge>

export const BADGES = {
    'welcome': {
        imageUrl: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3ZoZ3d1dWlzcnNuY2RwbTdpZGV1em9xeGQweHpma3B0Zm0xczdvZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BPJmthQ3YRwD6QqcVD/giphy.gif',
        title: 'Welcome',
        description: 'Welcome to Activepieces!',
    },
} as const