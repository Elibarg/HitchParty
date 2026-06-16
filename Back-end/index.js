/**
 * ============================================================================
 * HITCHPARTY - SERVIDOR PRINCIPAL
 * ============================================================================
 * Este ficheiro é o ponto de entrada do backend.
 * Aqui configuramos:
 *
 * - Express
 * - CORS
 * - Leitura de JSON
 * - Rotas da aplicação
 * - Ligação ao banco MySQL
 * - Inicialização do servidor
 * ============================================================================
 */

// ============================================================================
// IMPORTAÇÕES
// ============================================================================

// Framework principal do backend
const express = require('express');

// Middleware que permite comunicação entre Front-end e Back-end
const cors = require('cors');

// Rotas de autenticação
const authRoutes = require('./src/routes/authRoutes');

// Rotas relacionadas às caronas
const caronasRotas = require('./src/routes/caronasRotas');

// Pool de conexões MySQL
const pool = require('./src/config/database');

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================================

const app = express();

// ============================================================================
// MIDDLEWARES GLOBAIS
// ============================================================================

// Permite requisições vindas do navegador
app.use(cors());

// Permite receber JSON no corpo das requisições
app.use(express.json());

// ============================================================================
// REGISTRO DAS ROTAS
// ============================================================================

// Todas as URLs iniciadas por /api/auth
// serão tratadas pelo módulo de autenticação
app.use('/api/auth', authRoutes);

// Todas as URLs iniciadas por /api/rides
// serão tratadas pelo módulo de caronas
app.use('/api/rides', caronasRotas);

// ============================================================================
// TESTE DE CONEXÃO COM O MYSQL
// ============================================================================

async function testarBanco() {

    try {

        const conexao =
            await pool.getConnection();

        console.log(
            '✅ MySQL conectado!'
        );

        conexao.release();

    } catch (erro) {

        console.error(
            '❌ Erro MySQL:',
            erro
        );

    }

}

testarBanco();

// ============================================================================
// INICIALIZAÇÃO DO SERVIDOR HTTP
// ============================================================================

const PORTA = 8080;

app.listen(PORTA, () => {

    console.log(
        `🚀 Servidor do HitchParty ativo na porta ${PORTA}.`
    );

});