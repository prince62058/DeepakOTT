const crypto  = require('crypto');

const  generateTransactionId =  ()=>{
  // Generate 9 random bytes, convert to hex, then take 12 chars
  const randomStr = crypto.randomBytes(9).toString('hex').slice(0, 12);
  return `TXN${randomStr}`;
}

module.exports = {
generateTransactionId
}