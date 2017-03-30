class FakeChatApi {
  
  constructor(participantsMap) {
    this.sentMessages = [];
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

  sendMessage(text, threadID) {
    this.sentMessages.push([text, threadID]);
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

module.exports = FakeChatApi;