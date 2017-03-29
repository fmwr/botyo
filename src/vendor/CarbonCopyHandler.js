const Promise = require("bluebird");
const remove = require("diacritics").remove;

function failureText(handle, reason) {
    return `\u{2757}\u{FE0F} użytkownik ${handle} - ${reason}`;
}

function successText(handle, targetName) {
    return `\u{2714}\u{FE0F} ${targetName} (${handle}) powiadomiony`;
}

function notificationText(senderName, threadName, content) {
    return (
        `\u{1F4E2} Powiadomienie od: ${senderName}\n` +
        `\u{1F4E5} W wątku: ${threadName}\n\n` +
        `${content}`
    );
}

class CarbonCopyHandler {

    constructor(msg, api, threads) {
        this.msg = msg;
        this.api = api;
        this.threads = threads;
    }

    run() {
        const msg = this.msg;
        const pingExpressions = this.extractPingExpressions(msg);

        if (!pingExpressions) return msg;
        if (!pingExpressions.length === 0) return msg;

        if (pingExpressions.includes("@all")) {
            return this.pingAll();
        } else {
            return this.pingMany(pingExpressions);
        }
    }

    // 
    // Private
    // 

    extractPingExpressions() {
        const msg = this.msg;
        const bodyWithoutDiacritics = remove(msg.body);
        const pingExpressions = bodyWithoutDiacritics.match(/@\w+/g);
        return pingExpressions;
    }

    pingMany(pingExpressions) {
        const msg = this.msg;

        return Promise
            .all( pingExpressions.map( pingExpression => {

                return new Promise( (resolve, reject) => {

                    const username = pingExpression.slice(1);

                    const targetId = this.threads.getUserIdByThreadIdAndAlias(msg.threadID, username);
                    if (!targetId) {
                        resolve(failureText(username, "nierozpoznany"));
                        return;
                    }

                    // TODO: unneeded call everytime
                    const senderId = parseInt(msg.senderID.split("fbid:")[1] || msg.senderID);
                    if (!senderId) {
                        // TODO: username pointless here
                        resolve(failureText("senderID", "could not get senderId"));
                        return;
                    }

                    // TODO: unneeded call everytime
                    const threadNamePromise = this.api.getThreadInfo(msg.threadID).then(
                        info => {
                            return info.name || Promise.reject("No thread name");
                        }
                    );
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
                            error          => resolve(failureText(username, error))
                        );

                });

            }))
            .then(results => this.api.sendMessage(results.join("\n"), msg.threadID));

    }

    pingAll() {
        const msg = this.msg;

        const senderId = parseInt(msg.senderID.split("fbid:")[1] || msg.senderID);
        if (!senderId) {
            // TODO: 
            // resolve(failureText(username, "could not get senderId"));
            return;
        }

        const senderNamePromise = this.api.getUserInfo(senderId).then(info => info[senderId].name || Promise.reject("Could not get sender name", info));
        const threadInfoPromise = this.api.getThreadInfo(msg.threadID);

        // TODO: exclude self

        return Promise
            .all([threadInfoPromise, senderNamePromise])
            .then(
                ([threadInfo, senderName]) => {

                    const threadName = threadInfo.name;

                    Promise
                        .all( threadInfo.participantIDs.map( participantID => {

                            return new Promise( (resolve, reject) => {

                                const targetNamePromise = this.api.getUserInfo(participantID).then(info => info[participantID].firstName || Promise.reject("Could not get target name", info));
                                const messageSentPromise = this.api.sendMessage(notificationText(senderName, threadName, msg.body), participantID);

                                Promise
                                    .all([
                                        targetNamePromise,
                                        messageSentPromise,
                                    ])
                                    .then(
                                        ([targetName]) => resolve(successText(participantID, targetName)),
                                        error          => resolve(failureText(participantID, "nieznany błąd"))
                                    );

                            });

                        }))
                        .then(results => this.api.sendMessage(results.join("\n"), msg.threadID));

                },
                error => {
                    console.log("DEBUGGING", "CarbonCopyFilter.js", "error around .all([threadInfoPromise, senderNamePromise])", error);
                }

            )

    }

}

module.exports = CarbonCopyHandler;