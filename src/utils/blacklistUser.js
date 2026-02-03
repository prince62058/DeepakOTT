const blackListUser = [];

function addBlacklistUser(token) {
  return blackListUser.push(token);
}

function checkBlacklistUser(token) {
  return blackListUser.includes(token);
}

module.exports = {
  addBlacklistUser,
  checkBlacklistUser,
};
