class FakeThreadsApi {

  constructor(handlesToIds) {
    this.handlesToIds = handlesToIds;
  }

  getUserIdByThreadIdAndAlias(threadID, username) {
    return this.handlesToIds[threadID][username];
  }
}

module.exports = FakeThreadsApi;