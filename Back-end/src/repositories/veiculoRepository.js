const pool = require('../config/database');

// Responsabilidade: isolar todo SQL da tabela vehicles e mapear os nomes do
// banco (snake_case) para o contrato JavaScript usado pelo app (camelCase).
function mapVeiculoFromDb(veiculo) {
    if (!veiculo) return null;

    return {
        id: veiculo.id,
        userId: veiculo.user_id,
        brand: veiculo.brand,
        model: veiculo.model,
        licensePlate: veiculo.license_plate,
        plate: veiculo.license_plate,
        color: veiculo.color,
        year: veiculo.year,
        seats: veiculo.seats,
        imageUrl: veiculo.image_url,
        image: veiculo.image_url,
        isActive: Boolean(veiculo.is_active),
        createdAt: veiculo.created_at,
        updatedAt: veiculo.updated_at
    };
}

async function criarVeiculo(userId, veiculo) {
    // SQL fica restrito ao repository; services trabalham com camelCase.
    const [resultado] = await pool.query(
        `
        INSERT INTO vehicles
        (
            user_id,
            brand,
            model,
            license_plate,
            color,
            year,
            seats,
            image_url
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            userId,
            veiculo.brand,
            veiculo.model,
            veiculo.licensePlate || veiculo.plate,
            veiculo.color,
            veiculo.year,
            veiculo.seats,
            veiculo.imageUrl || null
        ]
    );

    return buscarPorId(resultado.insertId, userId);
}

async function listarPorUsuario(userId) {
    const [veiculos] = await pool.query(
        `
        SELECT *
        FROM vehicles
        WHERE user_id = ? AND is_active = TRUE
        ORDER BY created_at DESC
        `,
        [userId]
    );

    return veiculos.map(mapVeiculoFromDb);
}

async function buscarPorId(id, userId) {
    const [veiculos] = await pool.query(
        `
        SELECT *
        FROM vehicles
        WHERE id = ? AND user_id = ? AND is_active = TRUE
        `,
        [id, userId]
    );

    return mapVeiculoFromDb(veiculos[0]);
}

async function atualizarVeiculo(id, userId, veiculo) {
    await pool.query(
        `
        UPDATE vehicles
        SET
            brand = ?,
            model = ?,
            license_plate = ?,
            color = ?,
            year = ?,
            seats = ?,
            image_url = ?
        WHERE id = ?
            AND user_id = ?
            AND is_active = TRUE
        `,
        [
            veiculo.brand,
            veiculo.model,
            veiculo.licensePlate || veiculo.plate,
            veiculo.color,
            veiculo.year,
            veiculo.seats,
            veiculo.imageUrl ?? null,
            id,
            userId
        ]
    );

    return buscarPorId(id, userId);
}

async function removerVeiculo(id, userId) {
    await pool.query(
        `
        UPDATE vehicles
        SET is_active = FALSE
        WHERE id = ?
            AND user_id = ?
            AND is_active = TRUE
        `,
        [id, userId]
    );
}

async function contarPorUsuario(userId) {
    const [resultado] = await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM vehicles
        WHERE user_id = ?
            AND is_active = TRUE
        `,
        [userId]
    );

    return Number(resultado[0]?.total || 0);
}

module.exports = {
    criarVeiculo,
    listarPorUsuario,
    buscarPorId,
    atualizarVeiculo,
    removerVeiculo,
    contarPorUsuario
};
