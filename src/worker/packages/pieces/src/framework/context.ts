import {ConfigurationValue} from "./config/configuration-value.model";

export class Context{


    constructor(
        public readonly payload: unknown,
        public readonly webhookUrl: string,
        public readonly configs: ConfigurationValue
    ) {}

}