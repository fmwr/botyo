import CommandModule from "../CommandModule";
import ChatApi from "../../core/api/ChatApi";
import { dependencies as Inject } from "needlepoint";

@Inject(ChatApi)
export default class ColorCommand extends CommandModule {
    constructor(api) {
        super();

        this.api = api;
    }

    getCommand() {
        return "color";
    }

    getDescription() {
        return "Changes the chat color";
    }

    getUsage() {
        return "<hex string>";
    }

    validate(msg, argsString) {
        return argsString.match(/^#?([A-Fa-f0-9]{6})$/) !== null;
    }

    execute(msg, argsString) {
        return this.api.changeThreadColor(argsString, msg.threadID);
    }
}