# HitchParty

<!-- HP-DOC-001 | Documento oficial de funcionamento e estudo do HitchParty. -->

Este README é o documento oficial de funcionamento do HitchParty.

Ele está organizado em três partes:

- Etapa 1: funcionamento do aplicativo.
- Etapa 2: estrutura técnica do projeto.
- Etapa 3: mapa dos comentários codificados do código.

## Etapa 1 - Funcionamento do HitchParty

### 1. Visão geral do HitchParty

O HitchParty é um MVP de caronas urbanas diárias. Ele permite que motoristas publiquem caronas e que passageiros encontrem viagens disponíveis, solicitem vaga, acompanhem o status da solicitação, conversem por chat e visualizem um QR Code da viagem.

O sistema possui frontend em HTML, CSS e JavaScript, backend em Node.js/Express e banco de dados MySQL.

### 2. Objetivo do aplicativo

O objetivo do HitchParty é organizar o fluxo básico de uma carona urbana:

- cadastro e login de usuários;
- cadastro de veículos;
- criação de caronas por motoristas;
- busca de caronas por passageiros;
- solicitação de vaga;
- aceite ou recusa pelo motorista;
- visualização de passageiros confirmados;
- chat entre motorista e passageiro aceito;
- QR Code visual para identificação da viagem.

### 3. Perfis de usuário

**Motorista**

O motorista é um usuário autenticado que possui pelo menos um veículo cadastrado. Ele pode criar caronas, editar ou cancelar caronas próprias, aceitar ou recusar solicitações, visualizar passageiros confirmados e conversar com passageiros aceitos.

**Passageiro**

O passageiro é um usuário autenticado que busca caronas disponíveis. Ele pode abrir detalhes da carona, informar embarque e desembarque pelo Google Maps, adicionar referências informativas, solicitar vaga, acompanhar o status da solicitação, acessar chat após aceite e visualizar QR Code quando permitido.

**Usuário não autenticado**

O usuário não autenticado pode acessar telas públicas como login e cadastro. As telas protegidas redirecionam para login quando não existe JWT salvo no navegador.

### 4. Fluxo de cadastro

1. O usuário preenche nome, e-mail, telefone e senha.
2. O frontend valida campos básicos e envia `POST /api/auth/register`.
3. O backend valida duplicidade de e-mail.
4. O registro é gravado na tabela `users`.
5. Após sucesso, o usuário é redirecionado para login.

### 5. Fluxo de login

1. O usuário informa e-mail e senha.
2. O frontend envia `POST /api/auth/login`.
3. O backend consulta `users`, valida credenciais e remove dados sensíveis da resposta.
4. O backend gera um JWT.
5. O frontend salva o token em `localStorage`.
6. Chamadas protegidas passam a usar `Authorization: Bearer <token>`.

### 6. Fluxo de perfil do usuário

1. A tela de perfil exige usuário autenticado.
2. O frontend chama `GET /api/profile`.
3. O backend usa o `id` vindo do JWT.
4. O perfil é carregado de `users`.
5. A atualização usa `PUT /api/profile`.
6. O frontend atualiza os dados locais não sensíveis após resposta da API.

### 7. Fluxo de cadastro de veículo

1. O usuário autenticado abre a tela de veículos.
2. O frontend chama `GET /api/vehicles` para listar veículos.
3. Para criar ou editar, a tela envia `FormData` com dados e imagem opcional.
4. O backend usa `multer` para upload da imagem.
5. O service valida marca, modelo, cor, ano, placa e assentos.
6. O repository grava ou atualiza a tabela `vehicles`.

### 8. Fluxo de criação de carona

1. O motorista precisa estar autenticado e possuir veículo.
2. A tela carrega veículos via `GET /api/vehicles`.
3. O motorista informa origem, destino, data, horário, vagas, preço e observações.
4. O Google Maps/Places coleta coordenadas de origem e destino.
5. O frontend envia `POST /api/rides`.
6. O backend usa o motorista vindo do JWT, não do frontend.
7. A carona é gravada em `rides`.

### 9. Fluxo de busca de caronas

1. O passageiro informa origem e destino.
2. O Google Maps pode fornecer coordenadas dos pontos.
3. O frontend chama `GET /api/rides/search`.
4. O backend lista caronas disponíveis em `rides`.
5. O service calcula compatibilidade de rota usando coordenadas quando disponíveis.
6. O frontend exibe cards com motorista, rota, vagas, preço e desvio estimado.

### 10. Fluxo de detalhes da carona

1. O usuário abre `ride-detail.html?id=<rideId>`.
2. O frontend chama `GET /api/rides/:rideId`.
3. A tela exibe motorista, rota, data, horário, veículo, vagas, preço e observações.
4. O mapa de detalhes desenha a rota salva e paradas aprovadas.
5. Passageiros não motoristas podem solicitar vaga.
6. Motoristas podem editar ou cancelar a própria carona.

### 11. Fluxo de solicitação de vaga pelo passageiro

1. O passageiro abre os detalhes da carona.
2. O frontend consulta `GET /api/rides/:rideId/my-request`.
3. Se já existir solicitação, a tela repovoa embarque, desembarque e referências.
4. Para nova solicitação, o passageiro seleciona embarque e desembarque pelo Google Maps.
5. Referências são textos informativos e não entram no cálculo de rota.
6. O frontend envia `POST /api/rides/:rideId/requests`.
7. O backend valida limite de desvio e grava em `ride_requests`.

### 12. Fluxo de aceite ou recusa pelo motorista

1. O motorista acessa a tela de solicitações.
2. O frontend chama `GET /api/ride-requests`.
3. O motorista aceita com `PATCH /api/ride-requests/:requestId/accept`.
4. O aceite atualiza `ride_requests`, cria paradas em `ride_stops` e reduz `rides.available_seats`.
5. A recusa usa `PATCH /api/ride-requests/:requestId/reject`.
6. O passageiro recebe status atualizado e notificação.

### 13. Fluxo de visualização dos passageiros já adicionados à carona

1. A tela de detalhes chama `GET /api/rides/:rideId/passengers`.
2. O backend lista passageiros com solicitação aceita.
3. A resposta mostra apenas dados seguros: nome, foto, avaliação, contagem aproximada e referência de embarque.
4. Dados sensíveis como senha, e-mail, telefone e coordenadas privadas não são exibidos nessa seção.

### 14. Fluxo de chat entre motorista e passageiro

1. O chat exige JWT.
2. O backend verifica se o usuário é motorista da carona ou passageiro aceito.
3. Mensagens são persistidas em `ride_messages`.
4. A listagem usa `GET /api/rides/:rideId/messages`.
5. O envio usa `POST /api/rides/:rideId/messages`.

### 15. Fluxo de QR Code

O QR Code visual está implementado para caronas aceitas.

1. A tela chama `GET /api/rides/:rideId/qr`.
2. O backend gera um payload a partir de `rides` e `ride_requests`.
3. O frontend renderiza o QR no navegador.
4. A tela de scanner existe como preparação futura, mas ainda não possui endpoint real de validação operacional.

### 16. Fluxo de Google Maps

O Google Maps/Places é usado no frontend para:

- autocomplete de origem e destino na criação da carona;
- autocomplete na busca;
- seleção de embarque e desembarque na solicitação de vaga;
- desenho visual da rota;
- exibição de paradas aprovadas.

O backend não chama a API do Google diretamente no MVP atual. Ele recebe coordenadas do frontend e estima desvio com cálculo interno.

### 17. Checklist funcional do MVP

- Cadastro de usuário.
- Login.
- Autenticação JWT.
- Perfil do usuário.
- Cadastro, edição, listagem e remoção de veículos.
- Upload de imagem de veículo.
- Criação de carona.
- Busca de caronas.
- Visualização de detalhes da carona.
- Solicitação de vaga.
- Recuperação de solicitação já enviada.
- Aceite e recusa pelo motorista.
- Visualização de passageiros confirmados.
- Chat entre motorista e passageiro aceito.
- QR Code visual.
- Notificações.
- Integração com Google Maps no frontend.
- SQL oficial para recriar o banco completo.

## Etapa 2 - Estrutura técnica do projeto

### 1. Tecnologias utilizadas

- HTML, CSS e JavaScript no frontend.
- Bootstrap e Bootstrap Icons.
- SweetAlert2 em fluxos de alerta.
- Google Maps/Places no frontend.
- Node.js e Express no backend.
- JWT para autenticação.
- Multer para upload de imagens.
- MySQL com `mysql2/promise`.
- `dotenv` para variáveis de ambiente.

### 2. Estrutura de pastas

- `index.html`: entrada pública.
- `pages/`: telas HTML.
- `assets/js/`: scripts das telas.
- `assets/css/`: estilos.
- `assets/img/`: imagens estáticas.
- `components/`: header e navbar reutilizados.
- `Back-end/index.js`: servidor Express.
- `Back-end/src/routes`: definição das rotas.
- `Back-end/src/controllers`: adaptação HTTP/JSON.
- `Back-end/src/services`: regras de negócio.
- `Back-end/src/repositories`: SQL e acesso ao banco.
- `Back-end/src/middlewares`: JWT e upload.
- `Back-end/src/config`: conexão MySQL.
- `database/hitchparty_schema.sql`: schema oficial.

### 3. Explicação do backend

**Routes**

As rotas definem URLs, métodos HTTP e middlewares. Rotas privadas usam `authMiddleware`.

**Controllers**

Controllers recebem `req`, chamam services e devolvem JSON com status HTTP adequado.

**Services**

Services concentram regras de negócio: autenticação, validação de veículos, criação de caronas, solicitação de vagas, aceite, recusa, chat, QR e notificações.

**Repositories**

Repositories concentram SQL. Eles mapeiam dados do banco em `snake_case` para objetos em `camelCase` usados pelo backend/frontend.

**Middleware**

- `authMiddleware.js`: valida JWT e injeta `req.user`.
- `uploadMiddleware.js`: valida imagem de veículo e salva upload.

**Config e conexão com banco**

`Back-end/src/config/database.js` cria um pool MySQL usando variáveis do `.env`.

### 4. Explicação do frontend

**Páginas HTML**

Cada tela em `pages/` carrega CSS, componentes compartilhados e seu JavaScript correspondente.

**Arquivos JavaScript**

Cada arquivo em `assets/js/` controla uma tela ou comportamento global. O arquivo `app.js` centraliza `APP_CONFIG`, JWT, usuário local e `apiFetch`.

**Arquivos CSS**

Os CSS são separados por tela. `global.css` define base compartilhada, header e navbar inferior.

**Armazenamento local**

O frontend usa `localStorage` para:

- `hitchparty_token`: JWT;
- `hitchparty_user`: dados não sensíveis do usuário;
- `hitchparty_api_url`: sobrescrita opcional da URL da API;
- preferências locais da tela de configurações.

**Consumo da API**

Telas protegidas usam `apiFetch`, que adiciona `Authorization: Bearer <token>` quando há JWT salvo.

### 5. Explicação do banco de dados

**Tabelas utilizadas**

- `users`: usuários, perfil e autenticação.
- `vehicles`: veículos vinculados ao usuário.
- `rides`: caronas criadas por motoristas.
- `ride_requests`: solicitações de passageiros.
- `ride_stops`: paradas aprovadas após aceite.
- `ride_messages`: mensagens do chat.
- `notifications`: notificações persistentes.

**Campos principais**

- `users.password_hash`: senha armazenada pelo backend.
- `vehicles.user_id`: dono do veículo.
- `rides.driver_id`: motorista da carona.
- `rides.vehicle_id`: veículo usado na carona.
- `ride_requests.requester_id`: passageiro solicitante.
- `ride_requests.pickup_*` e `dropoff_*`: pontos do passageiro.
- `ride_requests.pickup_reference` e `dropoff_reference`: referências informativas.
- `ride_stops.stop_type`: pickup ou dropoff aprovado.
- `ride_messages.sender_id` e `receiver_id`: participantes do chat.

**Relacionamentos**

- `vehicles.user_id` referencia `users.id`.
- `rides.driver_id` referencia `users.id`.
- `rides.vehicle_id` referencia `vehicles.id`.
- `ride_requests.ride_id` referencia `rides.id`.
- `ride_requests.requester_id` e `driver_id` referenciam `users.id`.
- `ride_stops.ride_id` referencia `rides.id`.
- `ride_stops.ride_request_id` referencia `ride_requests.id`.
- `ride_messages.ride_id` referencia `rides.id`.
- `notifications.user_id` referencia `users.id`.

**Regras de integridade**

- E-mail de usuário é único.
- Placa de veículo é única.
- Passageiro não pode solicitar a própria carona.
- Um passageiro só pode ter uma solicitação por carona.
- Vagas ficam entre 0 e total de assentos.
- Paradas têm ordem única dentro da carona.

**Tabelas removidas**

Na estrutura atual não há tabela removida dentro do schema oficial. Migrações históricas e backups antigos não fazem parte da instalação nova.

**Confirmação do SQL oficial**

O arquivo `database/hitchparty_schema.sql` recria o banco completo do HitchParty, incluindo tabelas, índices, chaves estrangeiras, constraints, defaults, `AUTO_INCREMENT`, charset `utf8mb4` e collation `utf8mb4_unicode_ci`.

### 6. Explicação do arquivo `database/hitchparty_schema.sql`

O schema oficial:

1. remove o banco `hitchparty`, se existir;
2. recria o banco com UTF-8;
3. cria todas as tabelas usadas pelo sistema;
4. adiciona constraints e foreign keys;
5. resolve a dependência circular entre `ride_requests` e `ride_stops` com `ALTER TABLE`;
6. cria índices usados nas consultas frequentes.

Não existem inserts obrigatórios. O sistema cria dados reais pelas telas e endpoints.

### 7. Variáveis de ambiente

Crie `Back-end/.env` usando `Back-end/.env.example`:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=hitchparty
DB_CONNECTION_LIMIT=10
JWT_SECRET=troque_por_um_segredo_forte
```

Nunca versionar credenciais reais.

### 8. Como instalar e executar o projeto

Instalar dependências:

```bash
cd Back-end
npm install
```

Criar banco:

```bash
mysql -u seu_usuario -p < database/hitchparty_schema.sql
```

Rodar backend:

```bash
cd Back-end
npm run dev
```

ou:

```bash
npm start
```

Abrir:

```text
http://localhost:8080
```

Para teste em celular ou outra máquina, use:

```text
http://IP_DA_MAQUINA:8080
```

Evite testar apenas pelo Live Server. Se usar Live Server em `5500`, o backend e o MySQL também precisam estar disponíveis em `8080`.

### 9. Como testar os fluxos principais

1. Criar usuário motorista.
2. Fazer login.
3. Atualizar perfil.
4. Cadastrar veículo.
5. Criar carona.
6. Criar usuário passageiro.
7. Buscar carona.
8. Abrir detalhes.
9. Selecionar embarque e desembarque.
10. Solicitar vaga.
11. Entrar como motorista.
12. Aceitar ou recusar solicitação.
13. Ver passageiro confirmado.
14. Abrir chat.
15. Visualizar QR Code.
16. Verificar notificações e histórico.

## Etapa 3 - Mapa de Comentários Codificados do Código

Todo comentário crítico usa um identificador `HP-*`. O aluno pode procurar o código no arquivo indicado e depois consultar a explicação completa nesta tabela.

| Código | Arquivo | Local/Função | O que faz | Por que é importante |
| ------ | ------- | ------------ | --------- | -------------------- |
| HP-BACK-001 | `Back-end/index.js` | servidor principal | Inicializa Express, middlewares, frontend estático e API. | Mostra onde o backend começa. |
| HP-BACK-002 | `Back-end/index.js` | middlewares globais | Configura CORS, JSON e uploads. | Explica recursos compartilhados por todas as rotas. |
| HP-BACK-003 | `Back-end/index.js` | registro de rotas | Documenta fluxo tela -> rota -> controller -> service -> repository -> banco. | Ajuda a estudar a arquitetura em camadas. |
| HP-BACK-005 | `Back-end/src/controllers/caronasController.js` | controller de caronas | Adapta HTTP para services e padroniza JSON. | Mantém regras fora do controller. |
| HP-BACK-006 | `database/hitchparty_schema.sql` | `notifications` | Cria tabela de notificações. | Suporta avisos de solicitações, alterações e cancelamentos. |
| HP-AUTH-001 | `Back-end/src/services/authService.js` | autenticação | Centraliza cadastro e login. | Mantém validações antes de responder ao frontend. |
| HP-AUTH-002 | `Back-end/src/controllers/authController.js` | controller de autenticação | Recebe cadastro/login e chama service. | Padroniza respostas JSON. |
| HP-AUTH-003 | `Back-end/src/controllers/authController.js` | geração do JWT | Gera token com payload mínimo. | Evita colocar dados sensíveis no token. |
| HP-AUTH-005 | `Back-end/src/services/authService.js` | cadastro | Impede e-mail duplicado. | Protege a unicidade de contas. |
| HP-AUTH-006 | `Back-end/src/services/authService.js` | login | Valida credenciais. | Garante acesso apenas com dados corretos. |
| HP-AUTH-007 | `Back-end/src/services/authService.js` | remover dados sensíveis | Remove `passwordHash` da resposta. | Evita vazamento de senha. |
| HP-AUTH-008 | `Back-end/src/controllers/caronasController.js` | criar carona | Usa motorista vindo do JWT. | Impede que o frontend escolha outro motorista. |
| HP-AUTH-009 | `assets/js/app.js` | `apiFetch()` | Envia JWT automaticamente. | Centraliza autenticação no frontend. |
| HP-AUTH-010 | `assets/js/login.js` | `handleLogin()` | Salva JWT após login. | Permite navegação autenticada. |
| HP-AUTH-011 | `Back-end/.env.example` | `JWT_SECRET` | Orienta segredo privado. | Protege assinatura dos tokens. |
| HP-USER-001 | `Back-end/src/controllers/profileController.js` | perfil no backend | Usa `req.user.id` para perfil. | Garante que o usuário acesse só os próprios dados. |
| HP-USER-002 | `assets/js/profile.js` | tela de perfil | Carrega e atualiza perfil via API. | Mostra o fluxo do usuário logado. |
| HP-VEH-001 | `Back-end/src/controllers/veiculosController.js` | controller de veículos | Traduz HTTP/multipart para service. | Dá suporte ao upload e resposta JSON. |
| HP-VEH-002 | `Back-end/src/services/veiculoService.js` | validação de veículo | Valida campos e imagem. | Evita dados inválidos no banco. |
| HP-VEH-003 | `assets/js/vehicles.js` | tela de veículos | Lista, cria, edita e remove veículos. | Liga a garagem do usuário ao backend real. |
| HP-RIDE-001 | `database/hitchparty_schema.sql` | `rides` | Cria tabela de caronas. | Base do fluxo de motorista e passageiro. |
| HP-RIDE-002 | `database/hitchparty_schema.sql` | `ride_requests` | Cria tabela de solicitações. | Guarda pedidos e pontos do passageiro. |
| HP-RIDE-003 | `database/hitchparty_schema.sql` | `ride_stops` | Cria tabela de paradas. | Registra embarque/desembarque aprovados. |
| HP-RIDE-004 | `Back-end/src/routes/caronasRotas.js` | rotas de carona | Define busca, detalhes, criação, edição, chat, QR e solicitações. | Mostra quais rotas exigem JWT. |
| HP-RIDE-005 | `Back-end/src/services/caronaService.js` | service de caronas | Concentra regras de vagas, edição e cancelamento. | Mantém regra de negócio fora do SQL. |
| HP-RIDE-006 | `Back-end/src/services/caronaService.js` | `criarCarona()` | Cria carona para motorista autenticado. | Evita confiar em `driver_id` do frontend. |
| HP-RIDE-007 | `Back-end/src/services/caronaService.js` | edição relevante | Notifica passageiros quando a carona muda. | Preserva confirmação de quem já aceitou. |
| HP-RIDE-008 | `Back-end/src/services/caronaService.js` | cancelamento | Cancela carona e notifica passageiros. | Evita perda silenciosa de viagem. |
| HP-RIDE-009 | `Back-end/src/services/caronaService.js` | aceitar alteração | Passageiro confirma permanência. | Fecha fluxo de reconfirmação. |
| HP-RIDE-010 | `Back-end/src/services/caronaService.js` | rejeitar alteração | Passageiro sai e libera vaga. | Mantém contagem de vagas coerente. |
| HP-RIDE-015 | `Back-end/src/repositories/caronaRepository.js` | SQL de caronas | Isola SQL de `rides` e `ride_stops`. | Facilita manutenção das consultas. |
| HP-REQ-001 | `Back-end/src/services/rideRequestService.js` | service de solicitações | Controla pedido, recuperação, aceite e recusa. | Representa o fluxo passageiro -> motorista. |
| HP-REQ-002 | `Back-end/src/services/rideRequestService.js` | criar solicitação | Valida embarque, desembarque e desvio. | Impede pedidos incompatíveis. |
| HP-REQ-003 | `Back-end/src/services/rideRequestService.js` | aceitar solicitação | Cria paradas e reduz vagas. | Mantém banco consistente após aceite. |
| HP-REQ-004 | `Back-end/src/repositories/rideRequestRepository.js` | SQL de solicitações | Mapeia `ride_requests` para camelCase. | Liga banco e frontend. |
| HP-REQ-005 | `assets/js/requests.js` | tela de solicitações | Executa aceite/recusa. | Interface principal do motorista. |
| HP-REQ-006 | `assets/js/ride-detail.js` | solicitação existente | Repovoa dados já enviados. | Evita que passageiro perca informações. |
| HP-REQ-007 | `assets/js/ride-detail.js` | payload da solicitação | Separa referência textual de coordenadas. | Mantém referências apenas informativas. |
| HP-PASS-001 | `Back-end/src/repositories/rideParticipantRepository.js` | participantes | Identifica motorista e passageiros aceitos. | Libera chat, QR e passageiros confirmados. |
| HP-PASS-002 | `assets/css/ride-detail.css` | passageiros confirmados | Estiliza lista sem dados sensíveis. | Preserva privacidade na tela de detalhe. |
| HP-MAPS-001 | `Back-end/src/services/routeCompatibilityService.js` | compatibilidade | Estima desvio por coordenadas. | Suporta busca e solicitação de vaga. |
| HP-MAPS-002 | `Back-end/src/services/routeCompatibilityService.js` | fallback sem coordenadas | Não bloqueia busca textual. | Mantém busca funcionando mesmo sem pontos completos. |
| HP-MAPS-003 | `assets/js/create-ride.js` | `initMap()` | Inicializa Maps na criação de carona. | Preserva callback usado pelo script do Google. |
| HP-MAPS-004 | `assets/js/search.js` | Maps na busca | Envia coordenadas de origem/destino. | Melhora compatibilidade da rota. |
| HP-MAPS-005 | `assets/js/ride-detail.js` | mapa de detalhe | Desenha rota e paradas. | Ajuda passageiro e motorista a entenderem a viagem. |
| HP-MAPS-006 | `assets/css/create-ride.css` | área do mapa | Mantém layout estável. | Evita quebra visual no mobile. |
| HP-CHAT-001 | `database/hitchparty_schema.sql` | `ride_messages` | Cria tabela do chat. | Permite histórico real. |
| HP-CHAT-002 | `Back-end/src/services/chatService.js` | autorização do chat | Confirma participante aceito. | Evita acesso indevido à conversa. |
| HP-CHAT-003 | `Back-end/src/repositories/chatRepository.js` | SQL do chat | Lista e grava mensagens. | Mantém persistência do chat. |
| HP-CHAT-004 | `assets/js/chat.js` | tela de chat | Renderiza e envia mensagens. | Entrega conversa no frontend. |
| HP-CHAT-005 | `assets/css/chat.css` | layout do chat | Mantém composer e histórico usáveis. | Melhora uso em celular. |
| HP-QR-001 | `Back-end/src/services/qrService.js` | payload QR | Gera QR derivado de carona aceita. | Dispensa tabela própria de QR. |
| HP-QR-002 | `assets/js/trip-qr.js` | renderização do QR | Mostra QR no navegador. | Entrega identificação visual. |
| HP-QR-003 | `assets/js/scan-qr.js` | scanner futuro | Indica que validação real ainda não existe. | Evita falsa expectativa operacional. |
| HP-QR-004 | `assets/css/trip-qr.css` | estilo do QR | Define apresentação da tela. | Mantém QR legível. |
| HP-DB-001 | `database/hitchparty_schema.sql` | schema oficial | Recria o banco completo. | Permite reinstalação do zero. |
| HP-DB-002 | `database/hitchparty_schema.sql` | `users` | Cria tabela de usuários. | Base de autenticação e perfil. |
| HP-DB-003 | `database/hitchparty_schema.sql` | `vehicles` | Cria tabela de veículos. | Base para motorista criar carona. |
| HP-DB-004 | `database/hitchparty_schema.sql` | FKs de paradas | Adiciona FKs após criar tabelas. | Resolve dependência circular. |
| HP-DB-005 | `database/hitchparty_schema.sql` | índices | Cria índices de consulta. | Ajuda desempenho das listagens. |
| HP-DB-006 | `Back-end/index.js` | teste de conexão | Verifica acesso ao MySQL no boot. | Confirma ambiente configurado. |
| HP-DB-007 | `Back-end/src/config/database.js` | pool MySQL | Centraliza conexão. | Reutiliza conexões do backend. |
| HP-FRONT-001 | `assets/js/app.js` | configuração global | Centraliza API, token e usuário. | Evita duplicação no frontend. |
| HP-FRONT-002 | `assets/js/login.js` | tela de login | Controla autenticação no navegador. | Inicia sessão. |
| HP-FRONT-003 | `assets/js/register.js` | tela de cadastro | Envia dados para criação de usuário. | Inicia uso do sistema. |
| HP-FRONT-005 | `assets/js/create-ride.js` | tela de carona | Coleta dados e coordenadas. | Publica ou edita viagens. |
| HP-FRONT-006 | `assets/js/search.js` | tela de busca | Renderiza resultados reais da API. | Permite passageiro encontrar carona. |
| HP-FRONT-007 | `assets/js/ride-detail.js` | detalhe da carona | Concentra rota, motorista e solicitação. | Tela central do passageiro. |
| HP-CSS-001 | `assets/css/global.css` | CSS global | Define base visual comum. | Reduz repetição. |
| HP-CSS-002 | `assets/css/global.css` | navbar fixa | Documenta cuidado com espaço inferior. | Evita sobreposição em telas mobile. |
| HP-CSS-003 | `assets/css/ride-detail.css` | detalhe da carona | Estiliza tela crítica do passageiro. | Mantém leitura e ações claras. |
| HP-SEC-001 | `Back-end/src/middlewares/authMiddleware.js` | JWT | Valida token e injeta `req.user`. | Protege rotas privadas. |
| HP-SEC-002 | `Back-end/src/middlewares/uploadMiddleware.js` | upload seguro | Limita tipo e tamanho da imagem. | Reduz risco de arquivo indevido. |
| HP-SEC-003 | `Back-end/index.js` | erro global | Evita vazar stack trace. | Melhora segurança da API. |
| HP-DOC-001 | `README.md` | documentação oficial | Organiza funcionamento e código. | Ajuda estudo universitário. |
| HP-DOC-002 | `Back-end/.env.example` | exemplo de ambiente | Orienta configuração sem credenciais reais. | Facilita instalação segura. |

## Observações de preservação

Nesta revisão documental, não foram alterados:

- endpoints;
- contratos JSON;
- nomes de tabelas;
- nomes de colunas;
- relacionamentos;
- IDs ou classes usadas pelo JavaScript;
- lógica do Google Maps;
- regras de negócio.

