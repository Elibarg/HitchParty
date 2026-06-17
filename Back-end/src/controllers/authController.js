const authService =
    require('../services/authService');

const jwt = require('jsonwebtoken');



async function registrar(req, res) {

    console.log(req.body);

    try {

        const {
            fullName,
            email,
            phone,
            password

        } = req.body;

        const resultado =
            await authService
                .registrarUsuario(
                    fullName,
                    email,
                    phone,
                    password
                );

        return res.status(201).json({

            mensagem:
                'Usuário criado com sucesso.',

            usuario_id:
                resultado.insertId

        });

    }
    catch (erro) {

        console.error(erro);

        return res.status(400).json({

            erro:
                erro.message

        });

    }

}

async function entrar(req, res) {

    console.log(req.body);

    try {

        const {
            email,
            password
        } = req.body;

        const usuario =
            await authService
                .loginUsuario(
                    email,
                    password
                );

        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email
            },
            'hitchparty_secret',
            {
                expiresIn: '24h'
            }
        );

        return res.status(200).json({

            mensagem:
                'Login realizado com sucesso.',

            usuario,

            token

        });

    }
    catch (erro) {

        console.error(erro);

        return res.status(400).json({

            erro:
                erro.message

        });

    }

}

module.exports = {
    registrar, entrar
};