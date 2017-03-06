import FilterModule from "../FilterModule";
import { dependencies as Inject, singleton as Singleton } from "needlepoint";
import Threads from "../../core/config/Threads";
import ChatApi from "../../core/api/ChatApi";
import Promise from "bluebird";

@Singleton
@Inject(ChatApi, Threads)
export default class CarbonCopyFilter extends FilterModule {

    constructor(api, threads) {
        super();
        this.api = api;
        this.threads = threads;
    }

    filter(msg) {

        if (!msg.body) return msg;

        const pingExpressions = msg.body.match(/@\w+/g);

        if (!pingExpressions) return msg;

        const username = pingExpressions[0].slice(1);
        const targetId = this.threads.getUserIdByThreadIdAndAlias(msg.threadID, username);

        if (!targetId) {
            this.api.sendMessage("Użytkownik nierozpoznany", msg.threadID);
            return msg;
        }

        const senderId = parseInt(msg.senderID.split("fbid:")[1] || msg.senderID);
        
        if (!senderId) throw new Error("Could not get senderId");

        const threadNamePromise = this.api.getThreadInfo(msg.threadID)
            .then(info => info.name || Promise.reject("No thread name"));
        const senderNamePromise = this.api.getUserInfo(senderId)
            .then(info => info[senderId].name || Promise.reject("Could not get sender name", info));
        const targetNamePromise = this.api.getUserInfo(targetId)
            .then(info => info[targetId].firstName || Promise.reject("Could not get target name", info));

        Promise
            .all([targetNamePromise, threadNamePromise, senderNamePromise])
            .then(([targetName, threadName, senderName]) => {
                return [
                    targetName,
                    this.api.sendMessage({
                        body:
                            `\u{1F4E2} Powiadomienie od: ${senderName}\n` +
                            `\u{1F4E5} W wątku: ${threadName}\n\n` +
                            `${ msg.body }\n\n` +
                            `\u{1F517} https://m.me/${ msg.threadID }`
                    }, targetId)
                ];
            })
            .all()
            .then(
                ([targetName]) => {
                    return this.api.sendMessage(`\u{2714}\u{FE0F} Użytkownik ${targetName} został powiadomiony!`, msg.threadID)    
                }
            );

        return msg;
    }

}