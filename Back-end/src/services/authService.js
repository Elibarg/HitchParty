const usuarioRepository =
    require('../repositories/usuarioRepository');

async function registrarUsuario(
    fullName,
    email,
    phone,
    password
) {

    // Verifica se o usuário já existe
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

    return resultado;

}

async function loginUsuario(
    email,
    password
) {

    const user =
        await usuarioRepository
            .buscarPorEmail(email);

    if (!user) {

        throw new Error(
            'Usuário não encontrado.'
        );

    }

    if (
        user.password_hash !== password
    ) {

        throw new Error(
            'Senha inválida.'
        );

    }

    return user;

}

module.exports = {
    registrarUsuario, loginUsuario
};