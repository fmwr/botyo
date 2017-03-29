const assert = require("assert");
const sinon = require("sinon");
const CarbonCopyHandler = require("./CarbonCopyHandler");

describe("CarbonCopyHandler", () => {

  it("does nothing if message does not contain any user handles", done => {
    let message    = sampleMessage("some content wr");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.equal(chatApi.calls.length, 0);
      done();
    });
  });

  it("processes single user handle", done => {
    let message    = sampleMessage("some content @wr");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.deepEqual(chatApi.calls, [
        ['sendMessage', '📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @wr', '11112222' ],
        ['sendMessage', '✔️ Two (wr) powiadomiony', '22223333'],
      ]);
      done();
    });
  });

  it("processes two user handles", done => {
    let message    = sampleMessage("some content @wr @zt");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.deepEqual(chatApi.calls, [
        ['sendMessage', '📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @wr @zt', '11112222' ],
        ['sendMessage', '📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @wr @zt', '11113333' ],
        ['sendMessage', '✔️ Two (wr) powiadomiony\n✔️ Three (zt) powiadomiony', '22223333'],
      ]);
      done();
    });
  });

  it("processes @all clause", done => {
    let message    = sampleMessage("some content @all");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.deepEqual(chatApi.calls, [
        ['sendMessage', '📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @all', '11111111' ],
        ['sendMessage', '📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @all', '11112222' ],
        ['sendMessage', '📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @all', '11113333' ],
        ['sendMessage', '✔️ One (11111111) powiadomiony\n✔️ Two (11112222) powiadomiony\n✔️ Three (11113333) powiadomiony', '22223333'],
      ]);
      done();
    });
  });

});

class FakeThreadsApi {

  constructor(handlesToIds) {
    this.calls = [];
    this.handlesToIds = handlesToIds;
  }

  getUserIdByThreadIdAndAlias(threadID, username) {
    return this.handlesToIds[threadID][username];
  }
}

class FakeChatApi {
  
  constructor(participantsMap) {
    this.calls = [];
    this.participantsData = {};
    for (let userId in participantsMap) {
      this.participantsData[userId] = {
        name: participantsMap[userId],
        firstName: participantsMap[userId].split(" ")[1],
        vanity: 'irrelevant',
        thumbSrc: 'irrelevant',
        profileUrl: 'irrelevant',
        gender: 2,
        type: 'friend',
        isFriend: false,
        isBirthday: false,
      };
    }
  }

  sendMessage(...args) {
    this.calls.push(["sendMessage", ...args]);
    return Promise.resolve({});
  }

  getThreadInfo(...args) {
    return Promise.resolve({ 
      participantIDs: Object.keys(this.participantsData),
      name: 'Thread name',
      snippet: 'irrelevant',
      messageCount: 38,
      emoji: null,
      nicknames: null,
      color: null,
      lastReadTimestamp: -1
    });
  }

  getUserInfo(...args) {
    return Promise.resolve(this.participantsData);
  }
}

function sampleMessage(body) {
  return {
    type: 'message',
    senderID: '11111111',
    body: body,
    threadID: '22223333',
    messageID: 'irrelevant',
    attachments: [],
    timestamp: '1490822244147',
    isGroup: true,
  }
}

function sampleThreadsApi() {
  return new FakeThreadsApi({
    "22223333": {
      "zt": "11113333",
      "wr": "11112222", 
    },
  });
}

function sampleChatApi() {
  return new FakeChatApi({
    "11111111": "User One",
    "11112222": "User Two",
    "11113333": "User Three",
  });
}