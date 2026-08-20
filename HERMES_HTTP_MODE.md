# Conteúdo Mago — modo oficial Hermes via HTTP

Este documento registra o fluxo oficial de operação entre o Hermes e o Gerador de Carrossel.

## Regra principal

O Hermes não deve depender de:

- binário `hermes` dentro do ambiente de execução;
- caminho local `/opt/gerador-carrossel`;
- filesystem da VPS;
- comandos locais no host para produzir conteúdo.

O fluxo oficial é remoto, via HTTP.

## Base pública

`https://carrossel.magodastesouras.com.br`

## Endpoints principais

### Projetos

`GET /api/hermes/projects`

Uso: health/descrição da ponte Hermes → Studio.

`POST /api/hermes/projects`

Uso: criar ou atualizar projetos produzidos pelo Hermes. O endpoint monta o estado visual e devolve URLs de Studio e Render.

### Produção oficial

`GET /api/hermes/official-production`

Uso: consultar política, pautas, projetos e jobs oficiais do Conteúdo Mago.

### Render

`GET /api/hermes/render-project?project_id=PROJECT_ID`

Uso: validar o projeto completo.

`GET /api/hermes/render-project?project_id=PROJECT_ID&card=N`

Uso: validar um card específico. Cards fora da quantidade real do projeto devem retornar 404.

### Studio

`GET /studio?project=PROJECT_ID`

Uso: revisão e ajuste humano final.

## Fluxo operacional

1. Hermes recebe a pauta/instrução do usuário.
2. Hermes produz texto e estrutura dos cards segundo as regras da skill `social-media-mago`.
3. Hermes escolhe automaticamente o template T01–T12 mais adequado.
4. Hermes associa ou gera imagens adequadas à pauta.
5. Hermes grava o projeto via `POST /api/hermes/projects`.
6. Hermes valida o resultado no Render.
7. Se o Render estiver válido, Hermes entrega o link do Studio.
8. O conteúdo fica pronto para revisão; não publicar automaticamente em Instagram/Facebook sem autorização explícita.
9. Se um item falhar, registrar a falha e continuar os demais.

## Confirmações já validadas

A ponte HTTP foi testada com sucesso pelo Hermes do Telegram:

- `PROJECTS_API=200`
- `OFFICIAL_PRODUCTION_API=200`
- escrita via `POST /api/hermes/projects=200`
- Render do projeto de teste=200
- Studio gerado corretamente

Projeto de teste utilizado: `HERMES-HTTP-TEST-001`.

## Regras permanentes para o Hermes

- Operar o Conteúdo Mago exclusivamente pela API HTTP pública.
- Não usar `hermes -c` dentro do próprio ambiente do Telegram.
- Não depender de `/opt/gerador-carrossel`.
- Não acessar arquivos locais da VPS.
- Não alterar CM-037 a CM-066 sem instrução explícita.
- Validar cada projeto no Render antes de considerar pronto.
- Entregar o link do Studio para revisão.
- Nunca publicar automaticamente sem autorização explícita.

## Estado de referência

O lote CM-037 → CM-066 foi produzido e validado como base visual/operacional. A integração HTTP passa a ser o fluxo oficial para produções futuras.
