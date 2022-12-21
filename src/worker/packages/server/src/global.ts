class Globals {
    // TODO FIX
    private _pubsub: any;

    get pubsub() {
        return this._pubsub;
    }
}

export const globals = new Globals();
