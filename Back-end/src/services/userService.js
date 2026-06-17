const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/passwordUtils');
const { mapUser } = require('../utils/userMapper');

function mapUserSummary(row) {
    return mapUser(row, {
        ridesCount: Number(row.rides_count || 0),
        vehiclesCount: Number(row.vehicles_count || 0),
        messagesCount: 0,
        ratingValue: Number(row.rating_average || 0)
    });
}

async function getCurrentUser(userId) {
    const user = await userRepository.getSummaryById(userId);

    if (!user) {
        throw new Error('Usuário não encontrado.');
    }

    return mapUserSummary(user);
}

async function updateCurrentUser(userId, payload) {
    const existingUser = await userRepository.findByEmail(payload.email);

    if (existingUser && Number(existingUser.id) !== Number(userId)) {
        throw new Error('E-mail já cadastrado.');
    }

    const updatedUser = await userRepository.updateById(userId, {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        passwordHash: payload.password ? hashPassword(payload.password) : null
    });

    return mapUser(updatedUser);
}

module.exports = {
    getCurrentUser,
    updateCurrentUser
};
