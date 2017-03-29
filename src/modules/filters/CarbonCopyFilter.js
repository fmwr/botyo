import FilterModule from "../FilterModule";
import { dependencies as Inject, singleton as Singleton } from "needlepoint";
import Threads from "../../core/config/Threads";
import ChatApi from "../../core/api/ChatApi";
import CarbonCopyHandler from "../../vendor/CarbonCopyHandler";

@Singleton
@Inject(ChatApi, Threads)
export default class CarbonCopyFilter extends FilterModule {

    constructor(api, threads) {
        super();
        this.api = api;
        this.threads = threads;
    }

    filter(message) {
        if (!message.body) return message;

        new CarbonCopyHandler(
            message,
            this.api,
            this.threads,
        ).run();

        return message;
    }

}