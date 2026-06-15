-- ==========================================
-- HITCHPARTY DATABASE
-- ==========================================

DROP DATABASE IF EXISTS hitchparty;

CREATE DATABASE hitchparty
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE hitchparty;

-- ==========================================
-- USUÁRIOS
-- ==========================================

CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    senha_hash VARCHAR(255) NOT NULL,

    telefone VARCHAR(20),

    foto_url VARCHAR(500),

    email_verificado BOOLEAN DEFAULT FALSE,

    media_avaliacao DECIMAL(3,2) DEFAULT 0.00,

    ativo BOOLEAN DEFAULT TRUE,

    ultimo_login DATETIME NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- VEÍCULOS
-- ==========================================

CREATE TABLE veiculos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    usuario_id BIGINT NOT NULL,

    marca VARCHAR(100) NOT NULL,

    modelo VARCHAR(100) NOT NULL,

    placa VARCHAR(10) NOT NULL UNIQUE,

    cor VARCHAR(50),

    ano SMALLINT,

    ativo BOOLEAN DEFAULT TRUE,

    ultimo_login DATETIME NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_veiculo_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- ==========================================
-- CARONAS
-- ==========================================

CREATE TABLE caronas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    motorista_id BIGINT NOT NULL,

    veiculo_id BIGINT NOT NULL,

    origem VARCHAR(255) NOT NULL,

    destino VARCHAR(255) NOT NULL,

    origem_lat DECIMAL(10,8),

    origem_lng DECIMAL(11,8),

    destino_lat DECIMAL(10,8),

    destino_lng DECIMAL(11,8),

    data_hora_saida DATETIME NOT NULL,

    vagas_total INT NOT NULL,

    vagas_disponiveis INT NOT NULL,

    valor_sugerido DECIMAL(10,2),

    descricao TEXT NULL,

    status ENUM(
        'AGENDADA',
        'EM_ANDAMENTO',
        'FINALIZADA',
        'CANCELADA'
    ) DEFAULT 'AGENDADA',

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_carona_motorista
        FOREIGN KEY (motorista_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_carona_veiculo
        FOREIGN KEY (veiculo_id)
        REFERENCES veiculos(id),

    CONSTRAINT chk_limite_vagas
        CHECK (
            vagas_total > 0
            AND vagas_total <= 8
            AND vagas_disponiveis <= vagas_total
        )
);

-- ==========================================
-- SOLICITAÇÕES
-- ==========================================

CREATE TABLE solicitacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    carona_id BIGINT NOT NULL UNIQUE,

    passageiro_id BIGINT NOT NULL,

    status ENUM(
        'PENDENTE',
        'ACEITA',
        'RECUSADA',
        'CANCELADA'
    ) DEFAULT 'PENDENTE',

    observacao TEXT,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_solicitacao_carona
        FOREIGN KEY (carona_id)
        REFERENCES caronas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_solicitacao_passageiro
        FOREIGN KEY (passageiro_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_solicitacao
        UNIQUE (carona_id, passageiro_id)
);

-- ==========================================
-- AVALIAÇÕES
-- ==========================================

CREATE TABLE avaliacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    carona_id BIGINT NOT NULL,

    avaliador_id BIGINT NOT NULL,

    avaliado_id BIGINT NOT NULL,

    nota TINYINT NOT NULL,

    comentario TEXT,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_avaliacao_carona
        FOREIGN KEY (carona_id)
        REFERENCES caronas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_avaliador
        FOREIGN KEY (avaliador_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_avaliado
        FOREIGN KEY (avaliado_id)
        REFERENCES usuarios(id),

    CONSTRAINT chk_nota
        CHECK (nota BETWEEN 1 AND 5),

    CONSTRAINT chk_autoavaliacao
        CHECK (avaliador_id <> avaliado_id)
);

-- ==========================================
-- CONFIGURAÇÕES DO USUÁRIO
-- ==========================================

CREATE TABLE configuracoes_usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    usuario_id BIGINT NOT NULL UNIQUE,

    tema ENUM(
        'CLARO',
        'ESCURO'
    ) DEFAULT 'CLARO',

    idioma VARCHAR(10)
        DEFAULT 'pt-BR',

    mostrar_telefone BOOLEAN DEFAULT FALSE,

    receber_email BOOLEAN DEFAULT TRUE,

    receber_push BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_config_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- ==========================================
-- QR CODES
-- ==========================================

CREATE TABLE qr_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    carona_id BIGINT NOT NULL,

    codigo VARCHAR(255) NOT NULL UNIQUE,

    validade DATETIME NOT NULL,

    utilizado BOOLEAN DEFAULT FALSE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_qrcode_carona
        FOREIGN KEY (carona_id)
        REFERENCES caronas(id)
        ON DELETE CASCADE
);

-- ==========================================
-- NOTIFICAÇÕES
-- ==========================================

CREATE TABLE notificacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    usuario_id BIGINT NOT NULL,

    titulo VARCHAR(255) NOT NULL,

    mensagem TEXT NOT NULL,

    lida BOOLEAN DEFAULT FALSE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- ==========================================
-- PAGAMENTOS
-- ==========================================

CREATE TABLE pagamentos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    solicitacao_id BIGINT NOT NULL,

    carona_id BIGINT NOT NULL,

    passageiro_id BIGINT NOT NULL,

    motorista_id BIGINT NOT NULL,

    valor DECIMAL(10,2) NOT NULL,

    status ENUM(
        'PENDENTE',
        'PAGO',
        'RETIDO',
        'LIBERADO',
        'ESTORNADO',
        'CANCELADO'
    ) DEFAULT 'PENDENTE',

    metodo_pagamento ENUM(
        'PIX',
        'CARTAO_CREDITO',
        'CARTAO_DEBITO'
    ) DEFAULT 'PIX',

    comprovante VARCHAR(500),

    transacao_gateway VARCHAR(255) NULL,

    data_pagamento DATETIME NULL,

    data_liberacao DATETIME NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_pagamento_solicitacao
        FOREIGN KEY (solicitacao_id)
        REFERENCES solicitacoes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pagamento_carona
        FOREIGN KEY (carona_id)
        REFERENCES caronas(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pagamento_passageiro
        FOREIGN KEY (passageiro_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_pagamento_motorista
        FOREIGN KEY (motorista_id)
        REFERENCES usuarios(id),

    CONSTRAINT chk_valor_pagamento
        CHECK (valor > 0)
);

-- ==========================================
-- ÍNDICES
-- ==========================================

CREATE INDEX idx_usuario_email
ON usuarios(email);

CREATE INDEX idx_carona_origem
ON caronas(origem);

CREATE INDEX idx_carona_destino
ON caronas(destino);

CREATE INDEX idx_carona_data
ON caronas(data_hora_saida);

CREATE INDEX idx_carona_status
ON caronas(status);

CREATE INDEX idx_solicitacao_status
ON solicitacoes(status);

CREATE INDEX idx_avaliacao_avaliado
ON avaliacoes(avaliado_id);

CREATE INDEX idx_notificacao_usuario
ON notificacoes(usuario_id);

CREATE INDEX idx_pagamento_solicitacao
ON pagamentos(solicitacao_id);

CREATE INDEX idx_pagamento_carona
ON pagamentos(carona_id);

CREATE INDEX idx_pagamento_passageiro
ON pagamentos(passageiro_id);

CREATE INDEX idx_pagamento_motorista
ON pagamentos(motorista_id);

CREATE INDEX idx_pagamento_status
ON pagamentos(status);


CREATE INDEX idx_carona_motorista
ON caronas(motorista_id);

CREATE INDEX idx_solicitacao_passageiro
ON solicitacoes(passageiro_id);

CREATE INDEX idx_solicitacao_carona
ON solicitacoes(carona_id);
