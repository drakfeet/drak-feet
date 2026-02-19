# Firestore Handoff (Estrutura Completa + Indices)

Este documento serve para repassar o projeto para outra pessoa com tudo necessario para subir Firestore e Admin.

## 1) Arquivos oficiais do projeto
- Regras: `firestore.rules`
- Indices compostos: `firestore.indexes.json`
- Config Firebase CLI: `firebase.json`

## 2) Deploy no Firebase
1. `firebase login`
2. `firebase use <seu-project-id>`
3. `firebase deploy --only firestore:rules`
4. `firebase deploy --only firestore:indexes`

## 3) Estrutura de dados completa (colecoes e campos)

### `config/{docId}` (doc principal: `loja`)
- Campos obrigatorios de escrita: `nomeLoja`, `whatsapp`
- Campos permitidos:
`nomeLoja`, `whatsapp`, `mensagemPadrao`, `mensagemCarrinho`, `taxaMotoboy`, `parcelasSemJuros`, `descontoPix`, `pixelFacebook`, `gtmGoogle`, `googleAnalytics`, `menuCategorias`, `marcasCadastradas`, `categoriasCadastradas`, `avisoTexto`, `avisoBotaoTexto`, `avisoBotaoUrl`, `avisoMotoboy`, `avisoEntregaTexto`, `logoUrl`, `whatsappFlutuante`, `whatsappMensagemFlutuante`, `whatsappMensagemInicial`, `exibirHorario`, `horarioSegSexInicio`, `horarioSegSexFim`, `horarioSabInicio`, `horarioSabFim`, `atendeDOM`, `mensagemForaHorario`, `permitirForaHorario`, `telefone`, `email`, `endereco`, `atendeDomingo`, `customizacao`, `exibirTaxaEntrega`, `sliderAutoPlay`, `sliderInterval`, `exibirDescontoPix`, `exibirParcelas`, `valorMinimoParcela`, `aceitaDinheiro`, `aceitaBoleto`, `observacoesPagamento`, `mensagemCarrinhoItem`, `pixelAtivo`, `gtmAtivo`, `gaAtivo`, `footerTexto`, `rastrearCliquesOutbound`, `rastrearScrollDepth`, `rastrearTempoNaPagina`, `entregaRetiradaAtivo`, `entregaMotoboyAtivo`, `atualizadoEm`

### `produtos/{produtoId}`
- Obrigatorios: `nome`, `marca`, `precoPix`, `precoCartao`, `tamanhos`, `imagemUrl`, `ativo`, `tipoProdutoId`, `status`
- Campos permitidos:
`nome`, `marca`, `categoria`, `tipoProdutoId`, `tipoProdutoNome`, `slug`, `seoTitle`, `seoDescription`, `relacionados`, `featured`, `precoPix`, `precoCartao`, `tamanhos`, `imagemUrl`, `ativo`, `priceHistory`, `criadoEm`, `atualizadoEm`, `status`, `publishedAt`

### `tipos_produto/{tipoId}`
- Obrigatorios: `nome`, `nomePropriedade`, `opcoesTamanho`, `ativo`
- Campos: `nome`, `nomePropriedade`, `opcoesTamanho`, `ativo`

### `categorias/{categoriaId}`
- Obrigatorios: `nome`, `ordem`, `ativo`, `slug`
- Campos: `nome`, `slug`, `ordem`, `ativo`, `criadoEm`, `atualizadoEm`

### `marcas/{marcaId}`
- Obrigatorios: `nome`, `ativo`, `slug`
- Campos: `nome`, `slug`, `logoUrl`, `descricao`, `ativo`, `criadoEm`, `atualizadoEm`

### `banners/{bannerId}`
- Obrigatorios: `imagemUrl`, `ordem`, `ativo`
- Campos: `titulo`, `texto`, `imagemUrl`, `linkUrl`, `ordem`, `ativo`, `tipo`, `criadoEm`, `atualizadoEm`

### `menu_links/{linkId}`
- Obrigatorios: `texto`, `url`, `ordem`, `ativo`
- Campos: `texto`, `url`, `icone`, `ordem`, `abrirNovaAba`, `destacado`, `ativo`, `criadoEm`, `atualizadoEm`

### `redes_sociais/{redeId}`
- Obrigatorios: `nome`, `url`, `ativo`, `ordem`
- Campos: `tipo`, `nome`, `icone`, `url`, `ordem`, `ativo`, `criadoEm`, `atualizadoEm`

### `paginas/{paginaId}`
- Obrigatorios no create: `titulo`, `slug`, `modoConteudo`, `ativo`
- Campos: `titulo`, `slug`, `modoConteudo`, `conteudoHtml`, `conteudoTexto`, `conteudoBlocos`, `ativo`, `criadoEm`, `atualizadoEm`

### `metricas/{metricaId}`
- Obrigatorios: `tipo`, `timestamp`
- Campos: `tipo`, `timestamp`, `produtoId`, `produtoNome`, `bannerId`, `termo`, `filtros`, `userAgent`, `url`, `valor`, `total`, `items`, `source`

### `usuarios/{userId}`
- Obrigatorios no create: `email`, `role`, `ativo`, `criadoEm`
- Campos: `email`, `role`, `ativo`, `criadoEm`, `atualizadoEm`, `displayName`
- Roles aceitas: `admin`, `editor`, `analista` (e variantes em maiusculo)

### `audit_logs/{logId}`
- Obrigatorios: `action`, `entity`, `timestamp`, `userId`
- Campos: `userId`, `role`, `action`, `entity`, `entityId`, `before`, `after`, `timestamp`, `userAgent`, `meta`, `ip`

### `config_versions/{versionId}`
- Campos usados: `config`, `motivo`, `userId`, `timestamp`

### Colecoes opcionais ja suportadas
- `carrinhos/{userId}`: `items`, `updatedAt`
- `pedidos/{pedidoId}`: `userId`, `items`, `total`, `status`, `criadoEm`
- `cupons/{cupomId}`: `codigo`, `desconto`, `ativo`, `validade`
- `notificacoes/{userId}/mensagens/{mensagemId}`: `lida`, `mensagem`, `criadoEm`
- `reviews/{reviewId}`: `produtoId`, `userId`, `rating`, `comentario`

## 4) Indices compostos completos exigidos pelo codigo
Ja estao no arquivo `firestore.indexes.json`.

1. `produtos`: (`ativo` ASC, `status` ASC, `nome` ASC)
2. `produtos`: (`ativo` ASC, `nome` ASC)
3. `produtos`: (`tipoProdutoId` ASC, `ativo` ASC)
4. `produtos`: (`categoria` ASC, `ativo` ASC)
5. `banners`: (`ativo` ASC, `ordem` ASC)
6. `menu_links`: (`ativo` ASC, `ordem` ASC)
7. `redes_sociais`: (`ativo` ASC, `ordem` ASC)
8. `categorias`: (`ativo` ASC, `ordem` ASC)
9. `tipos_produto`: (`ativo` ASC, `nome` ASC)
10. `marcas`: (`ativo` ASC, `nome` ASC)
11. `paginas`: (`ativo` ASC, `titulo` ASC)
12. `paginas`: (`ativo` ASC, `slug` ASC)
13. `metricas`: (`tipo` ASC, `timestamp` ASC)

## 5) Fluxo correto de usuarios do admin
1. Criar usuario no Firebase Authentication (email/senha).
2. Garantir que existe documento em `usuarios/{uid}` com `email`, `role`, `ativo: true`.
3. Se existir documento legado por email (ex: `usuarios/email@dominio.com`), manter apenas como transitorio; o sistema agora nao trava a migracao para `uid`.

## 6) Erro "acesso negado" + painel recarregando sem parar
### Causa principal encontrada
- O usuario autenticava, mas a role nao carregava (perfil em `usuarios/{uid}` nao era criado corretamente em alguns cenarios de convite por email).
- Sem role, a rota protegida (`dashboard.read`) negava acesso e redirecionava para `index.html` repetidamente.

### Correcao aplicada no codigo
- `admin/assets/js/services/users.service.js`
  - `ensureProfile` agora continua a migracao mesmo se nao puder apagar doc legado por email.
- `admin/assets/js/core/auth.guard.js`
  - Bloqueado loop de redirecionamento: se ja estiver no `index.html` sem permissao, envia para `login.html?reason=permission_denied`.

## 7) Checklist rapido de producao
1. Regras publicadas (`firestore.rules`).
2. Indices publicados (`firestore.indexes.json`).
3. Usuario admin com doc em `usuarios/{uid}` e `role: "admin"`.
4. Campo `ativo: true` para o usuario.
5. Firebase/Cloudinary preenchidos em:
   - `admin/assets/js/core/config.js`
   - `public/assets/js/core/config.js`

## 8) Automacao para criar dados base
- Acesse `admin/index.html`
- Em **AÃ§Ãµes RÃ¡pidas**, clique em **Inicializar Banco**
- Fluxo:
1. Primeira confirmaÃ§Ã£o: manter documentos existentes
2. Segunda confirmaÃ§Ã£o (opcional): sobrescrever documentos base

Arquivos da automacao:
- `admin/assets/js/services/database-bootstrap.service.js`
- `admin/assets/js/pages/dashboard.page.js`
- `admin/index.html`

## 9) Seguranca no login
- O botao de correcao de usuario no cliente foi removido por seguranca.
- Nao ha elevacao de role pelo front-end.
- Correcao de usuario deve ser feita via backend confiavel (Admin SDK / Cloud Functions / script CLI).

## 10) Healthcheck automatico no login
- Ao autenticar, o `AuthService.login` valida automaticamente `usuarios/{uid}`.
- Se o documento nao existir, tenta migrar convite por email em `usuarios/{email}` para `usuarios/{uid}`.
- Se nao houver convite/perfil valido, ou se `ativo` for `false` ou `role` invalida, o login e interrompido com mensagem clara.
- Arquivos: `admin/assets/js/core/auth.service.js` e `admin/assets/js/services/users.service.js`

## 11) Seed por CLI (Node)
1. Instale dependencias: `npm install`
2. Rode seed: `npm run seed:firestore -- --serviceAccount ./serviceAccountKey.json`
3. Para sobrescrever docs base existentes: `npm run seed:firestore -- --serviceAccount ./serviceAccountKey.json --overwrite`

## 12) Setup completo em um comando (seed + rules + indexes)
1. Faça login no Firebase CLI: `npx firebase login`
2. Execute:
   `npm run setup:firebase -- --serviceAccount ./serviceAccountKey.json --projectId SEU_PROJECT_ID`
3. Com sobrescrita:
   `npm run setup:firebase -- --serviceAccount ./serviceAccountKey.json --projectId SEU_PROJECT_ID --overwrite`

Arquivos:
- `scripts/seed-firestore.js`
- `scripts/setup-firebase.js`
- `package.json`
