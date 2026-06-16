/**
 * ============================================================================
 * CONTROLADOR DE CARONAS (RIDES)
 * ============================================================================
 * Responsável por gerir toda a lógica de negócio relacionada com as viagens.
 * Este ficheiro atua como a "Cozinha" do sistema para o módulo de caronas.
 */

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
const caronaService =
    require('../services/caronaService');

async function buscarCaronas(req, res) {

    try {

        const caronas =
            await caronaService
                .buscarCaronas();

        return res.status(200)
            .json(caronas);

    } catch (erro) {

        console.error(erro);

        return res.status(500).json({
            erro:
                'Erro ao buscar caronas.'
        });

    }

}



// Importa a conexão com o banco de dados MySQL
const pool = require('../config/database');

/**
 * Cria uma nova carona no sistema.
 *
 * Fluxo:
 * 1. Recebe os dados enviados pelo frontend.
 * 2. Valida os campos obrigatórios.
 * 3. Salva a carona no MySQL.
 * 4. Retorna sucesso ao usuário.
 */
const criarCarona = async (req, res) => {

    try {

        // Extrai os dados enviados pelo frontend
        const {
            motorista_id,
            veiculo_id,

            origem,
            destino,

            origem_lat,
            origem_lng,

            destino_lat,
            destino_lng,

            data_hora_saida,

            vagas_total,

            valor_sugerido,

            descricao

        } = req.body;

        // ==================================================
        // VALIDAÇÕES BÁSICAS
        // ==================================================

        if (!motorista_id) {
            return res.status(400).json({
                erro: 'Motorista não informado.'
            });
        }

        if (!veiculo_id) {
            return res.status(400).json({
                erro: 'Veículo não informado.'
            });
        }

        if (!origem || !destino) {
            return res.status(400).json({
                erro: 'Origem e destino são obrigatórios.'
            });
        }

        // ==================================================
        // COMANDO SQL
        // ==================================================

        const sql = `
            INSERT INTO caronas (

                motorista_id,
                veiculo_id,

                origem,
                destino,

                origem_lat,
                origem_lng,

                destino_lat,
                destino_lng,

                data_hora_saida,

                vagas_total,
                vagas_disponiveis,

                valor_sugerido,
                descricao

            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Executa o INSERT no banco
        const [resultado] = await pool.query(sql, [

            motorista_id,
            veiculo_id,

            origem,
            destino,

            origem_lat,
            origem_lng,

            destino_lat,
            destino_lng,

            data_hora_saida,

            vagas_total,
            vagas_total, // inicia com todas as vagas livres

            valor_sugerido,

            descricao

        ]);

        // Retorna sucesso para o frontend
        return res.status(201).json({

            mensagem: 'Carona criada com sucesso!',

            carona_id: resultado.insertId

        });

    }
    catch (erro) {

        console.error('Erro ao criar carona:', erro);

        return res.status(500).json({
            erro: 'Erro interno do servidor.'
        });

    }

};

module.exports = { buscarCaronas, criarCarona };