const assert = require("assert");
const sinon = require("sinon");
const CarbonCopyHandler = require("./CarbonCopyHandler");

describe("CarbonCopyHandler", () => {
  it("should do nothing if message does not contain any user handles", () => {
    
    let message    = sampleMessage("some content wr");
    let chatApi    = new FakeChatApi();
    let threadsApi = new FakeThreadsApi();

    new CarbonCopyHandler(message, chatApi, threadsApi).run();

    assert.equal(chatApi.calls.length, 0);
    assert.equal(threadsApi.calls.length, 0);

  });
});

class FakeThreadsApi {
  constructor() { this.calls = []; }
  getUserIdByThreadIdAndAlias(...args) { this.calls.push(["getUserIdByThreadIdAndAlias", ...args]); }
}

class FakeChatApi {
  constructor() { this.calls = []; }
  getThreadInfo(...args) { this.calls.push(["getThreadInfo", ...args]); }
  getUserInfo(...args)   { this.calls.push(["getUserInfo",   ...args]); }
  sendMessage(...args)   { this.calls.push(["sendMessage",   ...args]); }
}

function sampleMessage(body) {
  return {
    type: 'message',
    senderID: 'SAMPLE-SENDER-ID',
    body: body,
    threadID: 'SAMPLE-THREAD-ID',
    messageID: 'mid.$gAAQIKRjSPDRhTTNvM1bG-4m4_cn6',
    attachments: [],
    timestamp: '1490822244147',
    isGroup: true,
  }
}