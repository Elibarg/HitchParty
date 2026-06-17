const userRepository = require('../repositories/userRepository');
const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const { mapUser } = require('../utils/userMapper');

async function registerUser({ fullName, email, phone, password }) {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
        throw new Error('E-mail já cadastrado.');
    }

    const createdUser = await userRepository.create({
        fullName,
        email,
        phone,
        passwordHash: hashPassword(password)
    });

    return mapUser(createdUser);
}

async function loginUser({ email, password }) {
    const user = await userRepository.findByEmail(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
        throw new Error('Credenciais inválidas.');
    }

    await userRepository.updateLastLogin(user.id);

    return mapUser(user);
}

module.exports = {
    registerUser,
    loginUser
};
