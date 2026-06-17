function getFirstName(fullName) {
    return fullName?.trim().split(/\s+/)[0] || 'Usuário';
}

function mapUser(row, extras = {}) {
    if (!row) return null;

    return {
        id: row.id,
        fullName: row.full_name,
        firstName: getFirstName(row.full_name),
        email: row.email,
        phone: row.phone,
        photoUrl: row.photo_url,
        emailVerified: Boolean(row.email_verified),
        ratingAverage: Number(row.rating_average || 0),
        isActive: Boolean(row.is_active),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        ...extras
    };
}

module.exports = {
    getFirstName,
    mapUser
};
