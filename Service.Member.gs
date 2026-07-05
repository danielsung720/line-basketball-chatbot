const MemberService = {
  getMemberProfile: (userId, groupId = LINE_GROUP_ID) => {
    const cachedUser = UserRepository.findActive(groupId, userId);

    if (cachedUser) {
      return {
        userId,
        displayName: cachedUser.name,
      };
    }

    const profile = LineClient.getGroupMemberProfile(groupId, userId);

    if (profile.displayName !== userId) {
      UserRepository.upsert(groupId, userId, profile.displayName);
    }

    return profile;
  },
};
