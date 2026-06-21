import {
    type AttachParams,
    Autumn,
    type CheckParams,
    type CreateEntityParams,
    type GetCustomerParams,
    type GetEntityParams,
    type ListPlansParams,
    type OpenCustomerPortalParams,
    type SetupPaymentParams,
    type TrackParams,
} from 'autumn-js'

function createRawClient({ secretKey, serverURL }: CreateRawClientParams): Autumn {
    return new Autumn({
        secretKey,
        serverURL,
        failOpen: true,
    })
}

export const autumnClient = ({ secretKey, customerId, serverURL }: AutumnClientParams) => {
    const client = createRawClient({ secretKey, serverURL })

    return {
        check(params: WithoutCustomerId<CheckParams>) {
            return client.check({ customerId, ...params })
        },
        track({ idempotencyKey, ...params }: TrackInput) {
            return client.track(
                { customerId, ...params },
                idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
            )
        },
        getCustomer(params?: { expand?: GetCustomerParams['expand'] }) {
            return client.customers.get({ customerId, expand: params?.expand })
        },
        attach(params: WithoutCustomerId<AttachParams>) {
            return client.billing.attach({ customerId, ...params })
        },
        openCustomerPortal(params?: WithoutCustomerId<OpenCustomerPortalParams>) {
            return client.billing.openCustomerPortal({ customerId, ...params })
        },
        setupPayment(params: WithoutCustomerId<SetupPaymentParams>) {
            return client.billing.setupPayment({ customerId, ...params })
        },
        createEntity(params: WithoutCustomerId<CreateEntityParams>) {
            return client.entities.create({ customerId, ...params })
        },
        getEntity(params: WithoutCustomerId<GetEntityParams>) {
            return client.entities.get({ customerId, ...params })
        },
        listPlans(params?: ListPlansParams) {
            return client.plans.list(params)
        },
    }
}

type WithoutCustomerId<T> = Omit<T, 'customerId'>

type CreateRawClientParams = {
    secretKey: string
    serverURL?: string
}

type AutumnClientParams = {
    secretKey: string
    customerId: string
    serverURL?: string
}

// autumn-js track has no first-class idempotency param (verified against the SDK types);
// the Idempotency-Key header is best-effort, so authoritative dedup is enforced on our side (S2).
type TrackInput = WithoutCustomerId<TrackParams> & {
    idempotencyKey?: string
}
