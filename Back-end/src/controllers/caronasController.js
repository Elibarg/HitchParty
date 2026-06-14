/**
 * ============================================================================
 * CONTROLADOR DE CARONAS (RIDES)
 * ============================================================================
 * Responsável por gerir toda a lógica de negócio relacionada com as viagens.
 * Este ficheiro atua como a "Cozinha" do sistema para o módulo de caronas.
 */

/**
 * BANCO DE DADOS TEMPORÁRIO (Mock)
 * ----------------------------------------------------------------------------
 * Esta variável simula a tabela 'caronas' do banco de dados MySQL.
 * * [NOTA PARA A EQUIPE DE BANCO DE DADOS]: 
 * Quando o MySQL estiver configurado, apagaremos esta variável e 
 * substituiremos a busca por uma query real (ex: SELECT * FROM caronas).
 * O formato dos dados abaixo é o "contrato" exato que o Front-end espera receber.
 */
const bancoCaronas = [
    {
        id: 1,
        driver: "Carlos Silva",
        route: "Joinville → Blumenau",
        date: "20/06/2026 - 07:10",
        seats: 2,
        price: "R$ 25,00"
    },
    {
        id: 2,
        driver: "Ana Souza",
        route: "Joinville → Curitiba",
        date: "21/06/2026 - 08:00",
        seats: 3,
        price: "R$ 40,00"
    }
];

/**
 * FUNÇÃO: Buscar Caronas (GET)
 * ----------------------------------------------------------------------------
 * Esta função é chamada sempre que o utilizador abre a página de busca.
 * O seu objetivo é recolher as caronas disponíveis e enviá-las para o Front-end.
 * * @param {Object} req - Dados da requisição (Futuramente lerá os filtros de cidade aqui).
 * @param {Object} res - Objeto de resposta para enviar os dados de volta à tela.
 */
/**
 * FUNÇÃO: Buscar Caronas (GET) com Filtros
 */
const buscarCaronas = (req, res) => {
    // 1. Lemos as variáveis que vieram na URL (req.query)
    // O Front-end envia em inglês (origin, destination)
    const { origin, destination } = req.query;

    // 2. Começamos com a lista completa de caronas
    let resultadosFiltrados = bancoCaronas;

    // 3. Se o utilizador pesquisou por Origem, filtramos a lista
    if (origin) {
        // Transformamos tudo em minúsculas (toLowerCase) para que "Joinville" e "joinville" funcionem igual
        resultadosFiltrados = resultadosFiltrados.filter(carona => 
            carona.route.toLowerCase().includes(origin.toLowerCase())
        );
    }

    // 4. Se o utilizador pesquisou por Destino, filtramos o que sobrou
    if (destination) {
        resultadosFiltrados = resultadosFiltrados.filter(carona => 
            carona.route.toLowerCase().includes(destination.toLowerCase())
        );
    }

    // 5. Devolvemos apenas as caronas que passaram pelos filtros!
    return res.status(200).json(resultadosFiltrados);
};

module.exports = { buscarCaronas };