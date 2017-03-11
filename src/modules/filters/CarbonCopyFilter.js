import FilterModule from "../FilterModule";
import { dependencies as Inject, singleton as Singleton } from "needlepoint";
import Threads from "../../core/config/Threads";
import ChatApi from "../../core/api/ChatApi";
import Promise from "bluebird";
import { remove } from "diacritics";

function failureText(handle, reason) {
    return `\u{2757}\u{FE0F} użytkownik ${handle} - ${reason}`;
}

function successText(handle, targetName) {
    return `\u{2714}\u{FE0F} użytkownik ${handle} powiadomiony (${targetName})`;
}

function notificationText(senderName, threadName, content) {
    return (
        `\u{1F4E2} Powiadomienie od: ${senderName}\n` +
        `\u{1F4E5} W wątku: ${threadName}\n\n` +
        `${content}`
    );
}

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

        const bodyWithoutDiacritics = remove(msg.body);
        const pingExpressions = bodyWithoutDiacritics.match(/@\w+/g);

        if (!pingExpressions) return msg;

        Promise
            .all( pingExpressions.map( pingExpression => {

                return new Promise( (resolve, reject) => {

                    const username = pingExpression.slice(1);

                    const targetId = this.threads.getUserIdByThreadIdAndAlias(msg.threadID, username);
                    if (!targetId) {
                        resolve(failureText(username, "nierozpoznany"));
                        return;
                    }

                    const senderId = parseInt(msg.senderID.split("fbid:")[1] || msg.senderID);
                    if (!senderId) {
                        resolve(failureText(username, "could not get senderId"));
                        return;
                    }

                    const threadNamePromise = this.api.getThreadInfo(msg.threadID).then(info => info.name || Promise.reject("No thread name"));
                    const senderNamePromise = this.api.getUserInfo(senderId).then(info => info[senderId].name || Promise.reject("Could not get sender name", info));
                    const targetNamePromise = this.api.getUserInfo(targetId).then(info => info[targetId].firstName || Promise.reject("Could not get target name", info));

                    Promise
                        .all([targetNamePromise, threadNamePromise, senderNamePromise])
                        .then(([targetName, threadName, senderName]) => [
                            targetName,
                            this.api.sendMessage(notificationText(senderName, threadName, msg.body), targetId)
                        ])
                        .all()
                        .then(
                            ([targetName]) => resolve(successText(username, targetName)),
                            error          => resolve(failureText(username, "nieznany błąd"))
                        );

                });

            }))
            .then(results => this.api.sendMessage(results.join("\n"), msg.threadID));


        return msg;
    }

}