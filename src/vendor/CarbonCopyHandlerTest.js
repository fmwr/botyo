const assert = require("assert");
const sinon = require("sinon");
const CarbonCopyHandler = require("./CarbonCopyHandler");

describe("CarbonCopyHandler", () => {

  it("does nothing if message does not contain any user handles", done => {
    let message    = sampleMessage("some content wr");
    let chatApi    = new FakeChatApi();
    let threadsApi = sampleThreadsApi()
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.equal(chatApi.calls.length, 0);
      done();
    });
  });

  it("processes single user handle", done => {
    let message    = sampleMessage("some content @wr");
    let chatApi    = new FakeChatApi();
    let threadsApi = sampleThreadsApi()
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.deepEqual(chatApi.calls, [
        ['sendMessage', '📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @wr', '11112222' ],
        ['sendMessage', '✔️ Two (wr) powiadomiony', '22223333'],
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
  
  constructor() {
    this.calls = [];
  }

  sendMessage(...args) {
    this.calls.push(["sendMessage", ...args]);
    // console.log("FakeChatApi received", ["sendMessage", ...args]);
    return Promise.resolve({});
  }

  getThreadInfo(...args) {
    // console.log("FakeChatApi received", ["getThreadInfo", ...args]);
    return Promise.resolve({ 
      participantIDs: [ '11111111', '11112222', '11113333' ],
      name: 'Thread name',
      snippet: 'test @wr @ziomek',
      messageCount: 38,
      emoji: null,
      nicknames: null,
      color: null,
      lastReadTimestamp: -1
    });
  }

  getUserInfo(...args) {
    // console.log("FakeChatApi received", ["getUserInfo", ...args]);
    return Promise.resolve({
      '11111111': {
        name: 'User One',
        firstName: 'One',
        vanity: 'tomekwr',
        thumbSrc: 'https://some.thumb',
        profileUrl: 'https://some.profile',
        gender: 2,
        type: 'friend',
        isFriend: false,
        isBirthday: false
      },
      '11112222': {
        name: 'User Two',
        firstName: 'Two',
        vanity: 'tomekwr',
        thumbSrc: 'https://some.thumb',
        profileUrl: 'https://some.profile',
        gender: 2,
        type: 'friend',
        isFriend: false,
        isBirthday: false
      },
      '11113333': {
        name: 'User Three',
        firstName: 'Three',
        vanity: 'tomekwr',
        thumbSrc: 'https://some.thumb',
        profileUrl: 'https://some.profile',
        gender: 2,
        type: 'friend',
        isFriend: false,
        isBirthday: false
      }
    });
  }
}

function sampleMessage(body) {
  return {
    type: 'message',
    senderID: '11111111',
    body: body,
    threadID: '22223333',
    messageID: 'mid.$gAAQIKRjSPDRhTTNvM1bG-4m4_cn6',
    attachments: [],
    timestamp: '1490822244147',
    isGroup: true,
  }
}

function sampleThreadsApi() {
  return new FakeThreadsApi({
    "22223333": {
      "ziom": "11113333",
      "wr": "11112222", 
    },
  });
}
