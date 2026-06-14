// Importamos as ferramentas principais que instalámos
const express = require('express'); // O construtor do nosso servidor
const cors = require('cors');       // O "porteiro" que permite que o front-end (browser) consiga conversar com este back-end sem ser bloqueado

// Importamos o "mapa" de rotas que criámos
const authRoutes = require('./src/routes/authRoutes');

// Criamos a nossa aplicação servidor
const app = express();

// Configurações essenciais
// Ativamos o porteiro para liberar os acessos
app.use(cors());

// Ativamos um "tradutor" que ensina o servidor a ler as mensagens que chegam no formato JSON
app.use(express.json()); 

// Ligamos as rotas ao endereço principal
// Dizemos ao servidor: "Toda a mensagem que chegar para '/api/auth', envia para o ficheiro authRoutes.js tratar"
app.use('/api/auth', authRoutes);

// Definimos a porta (o "canal de rádio") onde o servidor vai ficar à escuta
const PORTA = 8080;

// Ligamos o servidor!
app.listen(PORTA, () => {
    console.log(`🚀 Servidor do HitchParty ativo e a escutar na porta ${PORTA}.`);
});


// IMPORTAÇÃO DAS ROTAS
const autenticacaoRotas = require('./src/routes/authRoutes');
const caronasRotas = require('./src/routes/caronasRotas'); // <-- NOVA LINHA

// LIGAÇÃO DAS ROTAS ÀS URLs PRINCIPAIS
// O prefixo '/api/auth' direciona para o ficheiro de autenticação
app.use('/api/auth', autenticacaoRotas);

// O prefixo '/api/rides' direciona para o ficheiro de caronas.
// Qualquer pedido que comece por '/api/rides' será tratado pelo 'caronasRotas'.
app.use('/api/rides', caronasRotas); // <-- NOVA LINHA
