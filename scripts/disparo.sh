#!/usr/bin/env bash
# Operação das ondas de e-mail sem precisar copiar o código de acesso:
# ele é lido do .env.local, na raiz do projeto.
#
#   ./scripts/disparo.sh status 1        quantos ainda estão agendados
#   ./scripts/disparo.sh sincronizar 1   pergunta ao Resend o estado de cada envio
#   ./scripts/disparo.sh podar 3         tira da onda 3 quem já clicou nas anteriores
#   ./scripts/disparo.sh cancelar 3      cancela a onda 3 inteira
#
# A poda da onda 3 quer os cliques frescos, então rode nesta ordem, por
# volta das 20h15:
#
#   ./scripts/disparo.sh sincronizar 1
#   ./scripts/disparo.sh sincronizar 2
#   ./scripts/disparo.sh podar 3

set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API="${DISPARO_API:-https://corrida-na-praia-somma-club.vercel.app/api/disparos}"

ACAO="${1:-}"
ONDA="${2:-}"

if [[ -z "$ACAO" || -z "$ONDA" ]]; then
  echo "uso: $0 {status|sincronizar|podar|cancelar} {1|2|3}" >&2
  exit 1
fi

if [[ ! -f "$RAIZ/.env.local" ]]; then
  echo "erro: .env.local não encontrado em $RAIZ" >&2
  exit 1
fi

# tr tira aspas e espaços que sobrem da linha do .env
CODE="$(grep '^ADMIN_ACCESS_CODE=' "$RAIZ/.env.local" | cut -d= -f2- | tr -d '"'"'"' \r\n')"

if [[ -z "$CODE" ]]; then
  echo "erro: ADMIN_ACCESS_CODE vazio no .env.local" >&2
  exit 1
fi

# 'status' não é ação da API: é o teste seco, que conta sem enviar nada.
if [[ "$ACAO" == "status" ]]; then
  CORPO="{\"acao\":\"agendar\",\"onda\":$ONDA,\"filtro\":\"todos\",\"quando\":null,\"teste\":true}"
else
  CORPO="{\"acao\":\"$ACAO\",\"onda\":$ONDA}"
fi

curl -sS -X POST "$API" \
  -H "content-type: application/json" \
  -H "x-admin-codigo: $CODE" \
  -d "$CORPO"
echo
