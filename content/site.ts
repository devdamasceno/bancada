// Todo o texto e os preços do site moram aqui. Edite à vontade sem mexer nos componentes.
// Itens com [SUBSTITUIR] precisam de dado real antes de publicar.

export const marca = {
  nome: "Kriai",
  dominio: "www.kriai.online",
  descricao:
    "Fale do seu negócio e receba na hora um plano com site, vídeo, imagem, edição ou Google, e quanto custa.",
  whatsapp: "(32) 988039801", // [SUBSTITUIR] só números com DDD, ex.: 11912345678. Vazio esconde o link.
  email: "contato@kriai.online",
  cidade: "Juiz de Fora/MG",
  prazoResposta: "15 minutos", // [SUBSTITUIR] confirme o prazo real
};

/* ---------- serviços e preços ---------- */

export type ServicoId = "site" | "video" | "posicionamento" | "imagem" | "edicao_video" | "edicao_imagem";

export type Servico = {
  id: ServicoId;
  nome: string;
  /** Valor de entrada em reais. A ficha soma os valores dos serviços marcados. */
  aPartirDe: number;
  unidade: string;
  /** O que o preço de entrada inclui. A IA usa isto para explicar e oferecer a versão maior. */
  inclui: string;
  /** O que fica para o orçamento feito por você. */
  foraDoPrecoDeEntrada: string;
  prazo: string;
  /** Palavras que acendem o serviço na faixa "Já entendi" enquanto o cliente digita. */
  gatilhos: string[];
};

// [SUBSTITUIR] Confirme valores, escopo e prazos antes de publicar.
export const servicos: Servico[] = [
  {
    id: "site",
    nome: "Site",
    aPartirDe: 397,
    unidade: "",
    inclui: "Site de 1 página (landing page) com botão de WhatsApp, formulário, versão para celular e 1 rodada de ajustes.",
    foraDoPrecoDeEntrada: "Mais páginas, agendamento online, loja virtual, blog, domínio e hospedagem.",
    prazo: "3 dias",
    gatilhos: ["site", "landing", "pagina", "loja", "e-commerce", "ecommerce", "agendamento", "cardapio", "portfolio", "blog", "dominio"],
  },
  {
    id: "video",
    nome: "Vídeo",
    aPartirDe: 197,
    unidade: "por vídeo",
    inclui: "1 vídeo curto de até 60 segundos: a gente manda roteiro e orientações, o cliente grava com o celular e a gente edita com legenda e trilha, pronto para Reels, TikTok ou YouTube. 1 rodada de ajustes.",
    foraDoPrecoDeEntrada: "Vídeos longos e animações. Não fazemos gravação presencial.",
    prazo: "5 dias",
    gatilhos: ["video", "videos", "gravar", "gravacao", "filmar", "filmagem", "tiktok", "youtube", "institucional"],
  },
  {
    id: "posicionamento",
    nome: "Google e redes",
    aPartirDe: 197,
    unidade: "por mês",
    inclui: "Perfil no Google Meu Negócio criado ou ajustado, fotos, descrição, respostas a avaliações e 4 postagens por mês.",
    foraDoPrecoDeEntrada: "Gestão de anúncios (a verba dos anúncios é paga direto ao Google ou à Meta), SEO de site e gestão de Instagram.",
    prazo: "mensal",
    gatilhos: ["google", "seo", "aparecer", "achar", "anuncio", "anuncios", "ads", "trafego", "meu negocio", "maps", "instagram", "seguidores"],
  },
  {
    id: "imagem",
    nome: "Logo e artes",
    aPartirDe: 147,
    unidade: "",
    inclui: "Logo simples com 2 propostas e 1 rodada de ajustes, entregue em PNG e PDF.",
    foraDoPrecoDeEntrada: "Identidade visual completa, manual de marca, artes para posts, cardápio e banners.",
    prazo: "3 dias",
    gatilhos: ["logo", "logotipo", "marca", "identidade", "arte", "artes", "post", "posts", "banner", "flyer", "design"],
  },
  {
    id: "edicao_video",
    nome: "Edição de vídeo",
    aPartirDe: 47,
    unidade: "por vídeo",
    inclui: "Edição de 1 vídeo de até 60 segundos que o cliente já gravou (sem roteiro): corte, legenda, trilha e ajuste de cor. Pacote de 8 por mês sai R$ 297.",
    foraDoPrecoDeEntrada: "Vídeos acima de 60 segundos, podcasts, animações e motion design.",
    prazo: "2 dias",
    gatilhos: ["editar", "edicao", "edite", "reels", "reel", "corte", "cortes", "legenda", "legendas", "montagem", "podcast"],
  },
  {
    id: "edicao_imagem",
    nome: "Edição de imagem",
    aPartirDe: 47,
    unidade: "por 10 fotos",
    inclui: "Tratamento de 10 fotos: recorte com fundo branco, ajuste de cor e luz, pronto para loja, cardápio e redes.",
    foraDoPrecoDeEntrada: "Sessão de fotos, retoque de pele detalhado e montagens.",
    prazo: "1 dia",
    gatilhos: ["foto", "fotos", "tratamento", "tratar", "retoque", "fundo branco", "recorte", "imagem", "imagens"],
  },
];

export const formatarReais = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

/* ---------- abertura em vídeo ---------- */

export const intro = {
  // [SUBSTITUIR] Coloque o vídeo em /public/intro.mp4 (e a capa em /public/intro.jpg) e troque null por "/intro.mp4".
  // O vídeo começa sem som (regra dos navegadores), então deixe as legendas dentro do próprio vídeo.
  video: null as string | null,
  capa: null as string | null,
  pular: "Pular abertura",
  ativarSom: "Ativar som",
  // Enquanto não houver vídeo, estas frases fazem o papel dele (3 segundos cada).
  legendas: [
    "Enquanto você lê isto, uma IA monta o site do seu concorrente.",
    "Ele responde cliente às 3 da manhã.",
    "Quem responde primeiro vende primeiro.",
    "Seu negócio está pronto?",
  ],
};

/* ---------- tela de atendimento ---------- */

export const atendimento = {
  titulo: "Fale do seu negócio.",
  tituloDestaque: "Eu monto o plano.",
  texto:
    "Escreva do seu jeito, como no WhatsApp. Eu entendo o que você precisa, sugiro o que traz mais cliente e já mostro quanto custa.",
  rotuloCampo: "Sua mensagem",
  placeholder: "Ex.: tenho uma barbearia em Campinas e quero um site com agendamento e vídeos para o Instagram",
  placeholderConversa: "Responda aqui…",
  dica: "Enter envia",
  enviar: "Enviar",
  jaEntendi: "Já entendi:",
  pensando: "Pensando…",
  erros: {
    vazio: "Escreva o que você precisa antes de enviar.",
    servidor: "A mensagem não chegou porque o servidor não respondeu. Seu texto continua no campo: tente de novo em instantes.",
    limite: "Esta conversa ficou longa demais para continuar por aqui. Toque em Enviar pedido ou fale no WhatsApp.",
    devagar: "Muitas mensagens em pouco tempo. Espere alguns segundos e envie de novo.",
    recusa: "Não consigo ajudar com isso por aqui. Se for sobre o seu projeto, tente explicar de outro jeito.",
  },
};

// Demonstração animada abaixo do título. Os valores somam os preços de entrada da tabela acima.
export const demonstracoes = [
  {
    cliente: "tenho uma pizzaria em Santos e ninguém me acha no Google",
    entendi: "Pizzaria · Santos · quer ser encontrada",
    plano: "Perfil no Google + site com cardápio",
    custa: "a partir de R$ 594",
  },
  {
    cliente: "faço doces em casa e quero vender mais pelo Instagram",
    entendi: "Confeitaria caseira · vender pelo Instagram",
    plano: "10 fotos tratadas + 4 Reels editados",
    custa: "a partir de R$ 235",
  },
  {
    cliente: "abri uma clínica de estética e preciso de tudo do zero",
    entendi: "Clínica de estética · começando agora",
    plano: "Logo + site + perfil no Google",
    custa: "a partir de R$ 741",
  },
];

export const ficha = {
  titulo: "Seu pedido",
  verFicha: "Ver ficha",
  fecharFicha: "Fechar",
  vazio: "Rascunho vazio",
  salvando: "Salvando…",
  salvo: (hora: string) => `Rascunho salvo às ${hora}`,
  aPartirDe: "A partir de",
  enviar: "Enviar pedido",
  enviando: "Enviando…",
  falta: "Para enviar, a ficha precisa de pelo menos um serviço, seu nome e um WhatsApp ou e-mail.",
  novidades: "Quero receber ofertas e novidades (opcional).",
  rodape: `O orçamento final chega em até ${marca.prazoResposta}.`,
  sucessoTitulo: "Pedido enviado",
  sucesso: (numero: string) => `Pedido nº ${numero}. Respondemos em até ${marca.prazoResposta} pelo contato da ficha.`,
  erroEnvio: "O pedido não foi enviado porque o servidor não respondeu. Tente de novo em instantes.",
  campos: {
    servicos: "Serviços",
    negocio: "Negócio",
    cidade: "Cidade",
    objetivo: "Objetivo",
    ja_tem: "Já tem",
    prazo: "Prazo",
    investimento: "Investimento",
    nome: "Nome",
    whatsapp: "WhatsApp",
    email: "E-mail",
    observacoes: "Observações",
  },
};

/* ---------- privacidade ---------- */

export const secaoDados = {
  guardamos: [
    "Tudo o que você escreve no atendimento e as respostas do assistente, salvos enquanto a conversa acontece, mesmo que você não envie o pedido.",
    "As informações da ficha do pedido: serviços, negócio, cidade, objetivo, prazo, investimento, nome, WhatsApp e e-mail.",
    "De onde você chegou ao site (link de origem e campanha) e se usou celular ou computador.",
    "Com permissão de análise: páginas vistas e um identificador anônimo deste navegador.",
    "Com permissão de personalização: o código da sua conversa, para continuar de onde parou em outra visita.",
  ],
  naoGuardamos: [
    "Seu histórico de navegação ou buscas em outros sites.",
    "Cookies de anunciantes ou de terceiros.",
    "Dados vendidos ou repassados a outras empresas.",
  ],
};

export const consentimento = {
  versao: "2026-11-15.2",
  titulo: "Cookies e atendimento",
  texto:
    "O que você escreve no atendimento fica guardado para prepararmos seu orçamento, mesmo que você não envie o pedido. Usamos cookies próprios para o site funcionar e, se você permitir, para entender o que procura aqui. Nada de cookies de terceiros.",
  aceitarTodos: "Aceitar todos",
  soNecessarios: "Só os necessários",
  escolher: "Escolher",
  salvar: "Salvar escolha",
  categorias: {
    necessarios: {
      nome: "Necessários",
      texto: "Guardam sua escolha de cookies e mantêm a conversa aberta enquanto esta aba estiver aberta. Sempre ligados.",
    },
    analise: {
      nome: "Análise",
      texto: "Páginas vistas e uso do atendimento, com um identificador anônimo deste navegador.",
    },
    personalizacao: {
      nome: "Personalização",
      texto: "Lembram sua conversa para você continuar de onde parou em outra visita.",
    },
  },
};
