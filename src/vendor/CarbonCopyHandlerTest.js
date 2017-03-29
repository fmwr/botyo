const assert = require("assert");
const sinon = require("sinon");
const CarbonCopyHandler = require("./CarbonCopyHandler");

describe("CarbonCopyHandler", () => {

  it("does nothing if message does not contain any user handles", () => {
    let message    = sampleMessage("some content wr");
    let chatApi    = new FakeChatApi();
    let threadsApi = new FakeThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run();
    assert.equal(chatApi.calls.length, 0);
    assert.equal(threadsApi.calls.length, 0);
  });

  it("processes single user handle", done => {
    let message    = sampleMessage("some content @wr");
    let chatApi    = new FakeChatApi();
    let threadsApi = new FakeThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      done();
    });

  });

});

class FakeThreadsApi {

  constructor() {
    this.calls = [];
  }

  getUserIdByThreadIdAndAlias(...args) {
    this.calls.push(["getUserIdByThreadIdAndAlias", ...args]);
    // console.log("FakeThreadsApi received", ["getUserIdByThreadIdAndAlias", ...args]);
    return '11113333';
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
    this.calls.push(["getThreadInfo", ...args]);
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
    this.calls.push(["getUserInfo", ...args]);
    // console.log("FakeChatApi received", ["getUserInfo", ...args]);
    return Promise.resolve({
      '11112222': {
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
      '11113333': {
        name: 'User Two',
        firstName: 'Two',
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
    senderID: '11112222',
    body: body,
    threadID: '22223333',
    messageID: 'mid.$gAAQIKRjSPDRhTTNvM1bG-4m4_cn6',
    attachments: [],
    timestamp: '1490822244147',
    isGroup: true,
  }
}
