// Uma lista vazia que vai funcionar como a nossa "base de dados" temporária.
// Como não estamos ligados ao MySQL ainda, tudo o que guardarmos aqui desaparece quando o servidor for reiniciado.
// 1. O NOSSO BANCO DE DADOS TEMPORÁRIO
// Já começa com um utilizador "chumbado" para podermos testar o login à vontade!
const bancoUtilizadores = [
    {
        id: 1,
        name: "Dev",
        email: "123@123",
        phone: "000000000",
        password: "123"
    }
];

// Controlador: Registar uma nova conta
// 'req' (Requisição): É o pacote que o front-end nos enviou. Contém os dados do formulário.
// 'res' (Resposta): É o canal que usamos para devolver uma resposta ao front-end (ex: "Sucesso" ou "Erro").
const registrar = (req, res) => {
    // Tiramos os dados de dentro do "corpo" da mensagem (req.body) que o front-end enviou.
    // Mantemos os nomes em inglês (name, email, etc.) para combinar com o código do front-end e nada quebrar.
    const { name, email, phone, password } = req.body;

    // Vamos procurar na nossa lista se já existe alguém registado com este mesmo e-mail.
    const utilizadorExiste = bancoUtilizadores.find(utilizador => utilizador.email === email);
    
    if (utilizadorExiste) {
        // Se o utilizador já existir, paramos a função aqui.
        // O código 400 significa "Pedido Inválido" (Bad Request). Devolvemos um erro para aparecer no alerta do ecrã.
        return res.status(400).json({ message: "Este e-mail já está em uso no sistema." });
    }

    // Como o e-mail é novo, criamos um "pacote" com os dados desta nova pessoa.
    const novoUtilizador = { 
        id: bancoUtilizadores.length + 1, // Gera um ID automático sequencial (1, 2, 3...)
        name, 
        email, 
        phone, 
        password, // (Nota: num projeto real futuro, esta palavra-passe não pode ficar visível, terá de ser encriptada)
    };
    
    // Guardamos o novo utilizador na nossa lista.
    bancoUtilizadores.push(novoUtilizador);
    console.log("[Sistema] Novo utilizador registado:", novoUtilizador);

    // Avisamos o front-end que correu tudo perfeitamente.
    // O código 201 significa "Criado com sucesso" (Created).
    return res.status(201).json({ message: "Conta criada com sucesso!" });
};

// Controlador: Entrar (Iniciar Sessão)
const entrar = (req, res) => {
    // Tiramos apenas o e-mail e a palavra-passe que o utilizador digitou no ecrã de login.
    const { email, password } = req.body;

    // Vamos procurar na nossa lista um utilizador que tenha este exato e-mail E esta exata palavra-passe.
    const utilizador = bancoUtilizadores.find(u => u.email === email && u.password === password);

    if (!utilizador) {
        // Se não encontrarmos ninguém (ou se a senha estiver errada), devolvemos um erro de permissão.
        // O código 401 significa "Não Autorizado" (Unauthorized).
        return res.status(401).json({ message: "E-mail ou palavra-passe incorretos." });
    }

    // Se os dados estiverem corretos, criamos um "crachá de acesso" (token).
    // O ficheiro login.js do front-end precisa de receber este token para o guardar e saber que a sessão está ativa.
    const tokenGerado = "jwt-token-exemplo-12345";

    // Devolvemos a mensagem de sucesso e o crachá (token).
    return res.json({ 
        message: "Sessão iniciada com sucesso!",
        token: tokenGerado 
    });
};

// Exportamos (disponibilizamos) estas duas funções para que as nossas Rotas as consigam encontrar e usar.
module.exports = { registrar, entrar };