# Bancada: site com atendimento por IA

Site escuro com vídeo de abertura e um atendimento por IA (Claude) que conversa com o cliente, monta o plano,
mostra o preço "a partir de" e preenche a ficha do pedido ao vivo. Toda mensagem é salva na hora: quem desiste no
meio também fica registrado.

## Rodar no seu computador

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev                  # abre em http://localhost:3000
```

- Sem `SUPABASE_URL`/`SUPABASE_SECRET_KEY`, as conversas vão para `data/conversas/*.json` (só para teste).
- Sem `ANTHROPIC_API_KEY`, o site abre e salva as mensagens, mas a IA não responde.
- Para ver a abertura de novo: `http://localhost:3000/?intro`.

## Colocar no ar

1. **Claude:** em console.anthropic.com crie uma chave (API Keys) e coloque créditos.
2. **Supabase:** crie um projeto na região **South America (São Paulo)**. Em SQL Editor, cole e rode
   `supabase/schema.sql`. Em Project Settings > API, copie a URL e a chave secreta.
3. **Vercel:** importe o projeto, cadastre as variáveis do `.env.example` em Settings > Environment Variables e
   ligue seu domínio em Settings > Domains.

## Onde mexer

| O quê | Arquivo |
|---|---|
| Textos, preços, o que cada preço inclui, frases da abertura, exemplos animados | `content/site.ts` |
| Como a IA atende (tom, regras, ordem das perguntas) | `lib/atendente.ts` |
| Vídeo de abertura | coloque em `public/intro.mp4` e ajuste `intro.video` em `content/site.ts` |
| Cores e layout | `app/globals.css` (cores no topo, em `:root`) |
| Política de privacidade | `app/privacidade/page.tsx` |

## Ver os pedidos

No Supabase, abra **Table Editor > painel_pedidos**. A coluna `situacao` mostra `conversando`, `abandonado`
(parou de responder há 30 minutos) ou `enviado`. A coluna `conversa` traz o diálogo inteiro.

## Como funciona por dentro

- `app/api/atendimento`: recebe a mensagem, salva, chama o Claude em streaming e devolve texto e ficha aos poucos.
  A IA preenche a ficha chamando a ferramenta `atualizar_ficha`.
- `app/api/pedido`: confirma o pedido (rascunho vira enviado e ganha número).
- Modelo padrão: `claude-opus-5-5`, com esforço baixo para responder rápido. Troque por `ANTHROPIC_MODEL`.
- Proteções: 30 mensagens por conversa, 15 por minuto por IP, 2.000 caracteres por mensagem.
# bancada
# bancada
