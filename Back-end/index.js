/**
 * ============================================================================
 * HP-BACK-001 | HITCHPARTY - SERVIDOR PRINCIPAL
 * ============================================================================
 * Ponto de entrada do backend. Aqui ficam apenas as configuracoes globais:
 * Express, CORS, JSON, arquivos estaticos, rotas da API e inicializacao HTTP.
 * As regras de negocio ficam nos services e o SQL fica nos repositories.
 * ============================================================================
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const caronasRotas = require('./src/routes/caronasRotas');
const profileRoutes = require('./src/routes/profileRoutes');
const veiculosRoutes = require('./src/routes/veiculosRoutes');
const rideRequestsRoutes = require('./src/routes/rideRequestsRoutes');
const notificationsRoutes = require('./src/routes/notificationsRoutes');
const pool = require('./src/config/database');

const app = express();
const PORTA = Number(process.env.PORT || 8080);
const FRONTEND_DIR = path.resolve(__dirname, '..');

// HP-BACK-002 | Middlewares globais: CORS libera o frontend estatico, JSON
// permite payloads da API e /uploads expoe somente arquivos enviados pelo app.
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Frontend estatico usado nos testes pelo celular. O projeto mantem o
// index.html na raiz, com paginas, assets e componentes em pastas separadas.
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});
app.use('/assets', express.static(path.join(FRONTEND_DIR, 'assets')));
app.use('/components', express.static(path.join(FRONTEND_DIR, 'components')));
app.use('/pages', express.static(path.join(FRONTEND_DIR, 'pages')));

// HP-BACK-003 | Registro das rotas. Fluxo didatico:
// tela -> route -> controller -> service -> repository -> MySQL -> JSON.
// Rotas privadas recebem authMiddleware dentro de cada arquivo de routes.
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vehicles', veiculosRoutes);
app.use('/api/rides', caronasRotas);
app.use('/api/ride-requests', rideRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Resposta padrao para URLs de API que nao existem no MVP.
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint nao encontrado.'
    });
});

// HP-SEC-003 | Tratamento final de erros inesperados. Detalhes tecnicos ficam
// no terminal; o frontend recebe mensagem curta para nao vazar stack trace.
app.use((error, req, res, next) => {
    console.error(error);

    if (req.path.startsWith('/api')) {
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor.'
        });
    }

    return next(error);
});

async function testarBanco() {
    // HP-DB-006 | Verificacao de conectividade no boot. Nao cria tabelas:
    // a estrutura deve vir exclusivamente de database/hitchparty_schema.sql.
    try {
        const conexao = await pool.getConnection();

        console.log('MySQL conectado.');
        conexao.release();
    } catch (erro) {
        console.error('Erro MySQL:', erro);
    }
}

testarBanco();

app.listen(PORTA, () => {
    console.log(`Servidor do HitchParty ativo na porta ${PORTA}.`);
});
