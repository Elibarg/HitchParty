const crypto = require('crypto');

function hashPassword(password) {
    return crypto
        .createHash('sha256')
        .update(password)
        .digest('hex');
}

function verifyPassword(password, storedHash) {
    if (!storedHash) return false;

    const hashedPassword = hashPassword(password);

    return storedHash === hashedPassword || storedHash === password;
}

module.exports = {
    hashPassword,
    verifyPassword
};
