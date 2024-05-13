import EventEmitter from 'events'

export class TypedEventEmitter<TEventData> {
    private emitter = new EventEmitter()

    emit(eventArg: TEventData) {
        this.emitter.emit('event', eventArg)
    }

    on(handler: (eventArg: TEventData) => void) {
        this.emitter.on('event', handler)
    }

    off(handler: (eventArg: TEventData) => void) {
        this.emitter.off('event', handler)
    }
}
