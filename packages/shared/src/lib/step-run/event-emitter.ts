import EventEmitter from 'events'

class StepRunEventEmitter<TEventData> {
    private eventEmitter = new EventEmitter()

    emit(data: TEventData): void {
        this.eventEmitter.emit('stepRunEvent', data)
    }

    once(handler: (eventArg: TEventData) => void): void {
        this.eventEmitter.once('stepRunEvent', handler)
    }
}

export const stepRunEventEmitter = Object.freeze(new StepRunEventEmitter())
