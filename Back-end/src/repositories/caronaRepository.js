// src/repositories/caronaRepository.js

const pool = require('../config/database');

async function listarTodas() {

    const [caronas] =
        await pool.query(
            'SELECT * FROM caronas'
        );

    return caronas;
}

module.exports = {
    listarTodas
};