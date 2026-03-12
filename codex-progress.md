# Progresso do Codex

## O que foi implementado
- Arquivo de acompanhamento criado para registrar análises e mudanças futuras.
- Análise inicial da arquitetura, configuração, segurança e frontend do projeto.
- Identificados riscos funcionais nas permissões de OS, configuração de ambiente e acoplamento do frontend com a API.
- Segunda análise após inclusão de `application-dev.properties`.
- Confirmado que o wrapper `mvnw` agora está em formato compatível com Unix (`LF`), mas o ambiente atual continua sem `java`/`mvn` para validação local.
- Identificados novos riscos de segurança na configuração local por credenciais versionadas em arquivo de profile.
- Configuração local ajustada para usar `backend/.env` com `SPRING_PROFILES_ACTIVE=dev`.
- `application-dev.properties` alterado para consumir variáveis de ambiente em vez de segredos fixos.
- Bootstrap da aplicação ajustado para ativar corretamente o profile informado em `SPRING_PROFILES_ACTIVE`.
- Backend iniciado com sucesso em `http://localhost:8080` e endpoint `/ping` validado com retorno `200 pong`.
- Correção de autorização aplicada ao fluxo de alteração de status de OS.
- Suíte mínima de testes unitários adicionada para autenticação (`AuthService`) e autorização de OS (`OsService`).
- Testes executados com sucesso: 8 testes, 0 falhas.
- Padronização de configuração iniciada com compatibilidade retroativa para ambientes já publicados.
- Frontend alterado para usar URLs relativas de API, com proxy da Vercel para a API do Render.
- Profiles `dev` e `prod` ajustados para aceitar nomes novos de variáveis sem quebrar os nomes antigos já existentes.
- Testes executados novamente após a padronização: 8 testes, 0 falhas.
- Configuração padrão de JPA alterada para `ddl-auto=none`, evitando atualização automática de schema fora de `dev`.
- Profile `prod` ajustado para usar Hikari mais conservador (`maximum-pool-size=2`, `minimum-idle=0`, `idle-timeout=60000`) para reduzir conexões ociosas no Neon.
- `DatabaseCleanupConfig` limitado ao profile `dev`, impedindo execução de `ALTER TABLE` em todo startup de produção.
- Validação automatizada do backend não pôde ser concluída neste ambiente: o wrapper Maven do repositório está com `CRLF` e a tentativa de contorno encontrou falha na resolução da distribuição Maven.

## Arquivos modificados
- `codex-progress.md`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-prod.properties`
- `backend/src/main/java/org/smecrow/feedback/config/DatabaseCleanupConfig.java`
- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/java/org/smecrow/feedback/FeedbackApplication.java`
- `backend/.env` (arquivo local não rastreado)
- `backend/src/main/java/org/smecrow/feedback/controller/OsController.java`
- `backend/src/main/java/org/smecrow/feedback/service/OsService.java`
- `backend/src/test/java/org/smecrow/feedback/service/AuthServiceTest.java`
- `backend/src/test/java/org/smecrow/feedback/service/OsServiceTest.java`
- `backend/src/main/resources/application-prod.properties`
- `backend/.env.example`
- `frontend/auth.js`
- `frontend/vercel.json`

## Status atual do projeto
- Projeto mapeado como aplicação Spring Boot + frontend estático empacotado no backend.
- Existe agora uma suíte inicial de testes unitários para autenticação e autorização.
- Existe agora um profile `dev` com configuração local de banco/JWT/CORS.
- O profile `dev` está sendo ativado via `backend/.env`.
- Produção agora herda `ddl-auto=none` como padrão seguro e não executa mais o cleanup SQL de startup fora de `dev`.
- Produção agora mantém pool JDBC mais enxuto para reduzir conexões ociosas com o Neon.
- Backend em execução local na porta `8080`.
- Frontend local/backend empacotado usa mesma origem para `/api/...`.
- Deploy da Vercel mantém compatibilidade via rewrite `/api/*` para o backend do Render.

## Próximos passos recomendados
- Manter segredos apenas no `backend/.env` e fora de arquivos versionados.
- Definir um fluxo claro para ativação do profile `dev` (`SPRING_PROFILES_ACTIVE=dev` ou equivalente) e documentá-lo.
- Corrigir o `backend/mvnw` versionado para `LF` e validar a suíte do backend novamente.
- Confirmar no ambiente de produção se `DATABASE_URL` usa a string pooled/pooler do Neon.
- Cobrir com testes os endpoints HTTP mais sensíveis (`/api/auth` e `/api/os`) usando `MockMvc`.
- Revisar a configuração de ambiente local e alinhar `.env.example` com os placeholders reais usados pelo Spring.
- Adicionar testes para autenticação, autorização e fluxos de OS.
- Corrigir o bug de UX dos filtros do dashboard.
