const assert = require("assert");
const CarbonCopyHandler = require("./CarbonCopyHandler");
const FakeThreadsApi = require("./FakeThreadsApi");
const FakeChatApi = require("./FakeChatApi");

describe("CarbonCopyHandler", () => {

  it("does nothing if message does not contain any user handles", done => {
    let message    = sampleMessage("some content");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.equal(chatApi.sentMessages.length, 0);
      done();
    });
  });

  it("processes single user handle", done => {
    let message    = sampleMessage("some content @wr");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.deepEqual(chatApi.sentMessages, [
        ['📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @wr', '11112222' ],
        ['✔️ Powiadomiono User Two', '22223333'],
      ]);
      done();
    });
  });

  it("processes two user handles", done => {
    let message    = sampleMessage("some content @wr @zt");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.deepEqual(chatApi.sentMessages, [
        ['📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @wr @zt', '11112222' ],
        ['📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @wr @zt', '11113333' ],
        ['✔️ Powiadomiono User Two\n✔️ Powiadomiono User Three', '22223333'],
      ]);
      done();
    });
  });

  it("processes @all clause", done => {
    let message    = sampleMessage("some content @all");
    let chatApi    = sampleChatApi();
    let threadsApi = sampleThreadsApi();
    new CarbonCopyHandler(message, chatApi, threadsApi).run().then(() => {
      assert.deepEqual(chatApi.sentMessages, [
        ['📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @all', '11111111' ],
        ['📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @all', '11112222' ],
        ['📢 Powiadomienie od: User One\n📥 W wątku: Thread name\n\nsome content @all', '11113333' ],
        ['✔️ Powiadomiono User One\n✔️ Powiadomiono User Two\n✔️ Powiadomiono User Three', '22223333'],
      ]);
      done();
    });
  });

});

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