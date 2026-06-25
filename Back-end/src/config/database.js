const mysql = require('mysql2/promise');

if (!process.env.DB_USER) {
    throw new Error('DB_USER não configurado no ambiente.');
}

// HP-DB-007 | Centraliza a conexao MySQL. Repositories compartilham este pool,
// evitando abrir conexao nova a cada consulta e mantendo a configuracao no .env.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hitchparty',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10)
});

// Saida: pool compartilhado para executar queries com async/await.
module.exports = pool;
