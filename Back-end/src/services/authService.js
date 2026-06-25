const usuarioRepository =
    require('../repositories/usuarioRepository');
const caronaRepository =
    require('../repositories/caronaRepository');
const veiculoRepository =
    require('../repositories/veiculoRepository');

// HP-AUTH-001 | Service de autenticacao: valida cadastro/login antes do
// controller responder. Atencao futura: passwordHash deve receber hash real.
async function registrarUsuario(
    fullName,
    email,
    phone,
    password
) {

    // HP-AUTH-005 | Impede duplicidade de e-mail antes do INSERT em users.
    const usuarioExistente =
        await usuarioRepository
            .buscarPorEmail(email);

    if (usuarioExistente) {

        throw new Error(
            'E-mail já cadastrado.'
        );

    }

    const resultado =
        await usuarioRepository
            .criarUsuario(
                fullName,
                email,
                phone,
                password
            );

    // Saida: resultado do MySQL, incluindo insertId usado pelo controller.
    return resultado;

}

async function loginUsuario(
    email,
    password
) {

    // HP-AUTH-006 | Valida credenciais vindas do authController.
    const user =
        await usuarioRepository
            .buscarPorEmail(email);

    if (!user) {

        throw new Error(
            'Usuário não encontrado.'
        );

    }

    if (
        user.passwordHash !== password
    ) {

        throw new Error(
            'Senha inválida.'
        );

    }

    return user;

}

function removerDadosSensiveis(user) {

    if (!user) return null;

    // HP-AUTH-007 | Remove passwordHash antes de devolver usuario ao frontend.
    return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        photoUrl: user.photoUrl,
        ratingAverage: user.ratingAverage
    };

}

async function buscarPerfil(userId) {
    const user =
        await usuarioRepository
            .buscarPorId(userId);

    if (!user) {
        throw new Error('Usuário não encontrado.');
    }

    const [ridesCount, vehiclesCount] =
        await Promise.all([
            caronaRepository.contarPorMotorista(userId),
            veiculoRepository.contarPorUsuario(userId)
        ]);

    return {
        ...removerDadosSensiveis(user),
        ridesCount,
        vehiclesCount,
        messagesCount: 0
    };
}

async function atualizarPerfil(userId, dados) {
    if (!dados.fullName || !dados.email || !dados.phone) {
        throw new Error('Nome, e-mail e telefone são obrigatórios.');
    }

    const user =
        await usuarioRepository
            .atualizarUsuario(userId, dados);

    return removerDadosSensiveis(user);
}

module.exports = {
    registrarUsuario,
    loginUsuario,
    removerDadosSensiveis,
    buscarPerfil,
    atualizarPerfil
};
