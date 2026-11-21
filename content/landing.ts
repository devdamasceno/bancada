// Textos da página inicial (landing). Os preços e prazos vêm de content/site.ts (servicos), as perguntas
// frequentes de content/atendente.ts: mude lá e a página acompanha.
// Itens com [SUBSTITUIR] precisam de dado real antes de publicar.

export const landing = {
  titulo: "Propaganda de agência, no tamanho do seu negócio.",
  subtitulo:
    "Site, vídeo curto, Perfil no Google e logo para barbearias, confeitarias, clínicas e comércios de todo o Brasil.",
  subtituloDestaque:
    "A Kria, nossa assistente de IA, mostra o preço em 2 minutos, e você paga a primeira metade só se aprovar a proposta.",
  botao: "Montar meu plano grátis",
  botaoSecundario: "Ver campanhas",
  nota: "Grátis e sem cadastro. Atendimento 100% online, a partir de Juiz de Fora (MG).",
  pecasRotulo: "Peças demonstrativas",
  whatsappMensagem: "Olá, Kriai! Vim pelo site e quero conversar sobre a divulgação do meu negócio.",

  nav: [
    { rotulo: "Preços", href: "/#precos" },
    { rotulo: "Campanhas", href: "/portfolio" },
    { rotulo: "Atendimento", href: "/conversa" },
  ],
  botaoTopo: "Montar meu plano",

  precos: {
    titulo: "Tabela de preços",
    texto:
      "Preço de entrada de cada serviço. Dá para começar por um e somar os outros depois. Projeto personalizado recebe orçamento sem compromisso.",
    rodape:
      "Pix ou cartão em até 3x. Domínio e hospedagem do site são à parte e vêm explicados na proposta.",
  },

  campanhas: {
    titulo: "Em cartaz",
    texto:
      "Cada campanha nasce do negócio do cliente: o que ele vende, como o cliente dele decide e onde a conversa fecha. Por isso nenhuma página se parece com a outra.",
  },

  modelos: {
    titulo: "Modelos por segmento",
    texto:
      "Demonstrações de como fica o site de quem vende o que você vende. O seu sai com a sua cara, o seu preço e o botão de WhatsApp no lugar certo.",
  },

  comoFunciona: {
    titulo: "Do primeiro oi ao site no ar",
    passos: [
      {
        titulo: "Você conversa com a Kria",
        texto: "Ela entende o seu negócio, monta o plano e mostra o preço. Leva uns 2 minutos.",
      },
      {
        titulo: "A proposta chega em até 1 dia útil",
        texto: "Uma pessoa da equipe revisa o pedido e manda a proposta pelo WhatsApp ou e-mail.",
      },
      {
        titulo: "Você aprova e paga 50%",
        texto: "O trabalho só começa depois que você concorda com o que vai receber e quanto custa.",
      },
      {
        titulo: "Prévia, ajuste e entrega",
        texto: "Você vê antes, pede o ajuste e só então paga o restante e recebe a versão final.",
      },
    ],
  },

  duvidas: { titulo: "Perguntas que todo mundo faz" },

  fechamento: {
    titulo: "Sua campanha é a próxima",
    texto: "Escreva do seu jeito, como no WhatsApp. Em 2 minutos a Kria mostra o plano e o preço de entrada.",
  },

  rodape: {
    servicos: "Serviços",
    agencia: "Agência",
    contato: "Contato",
    privacidade: "Privacidade",
    cookies: "Preferências de cookies",
    assinatura: "Feito com IA e revisado por gente.",
  },
};

/** Modelos da parede. Fotos em public/modelos (Pexels, licença livre para uso comercial). */
export const modelos = [
  {
    id: "barbearia",
    rotulo: "Barbearia",
    legenda:
      "Preços no quadro, escolha do barbeiro e horário dentro do expediente. O pedido chega pronto no WhatsApp.",
    titulo: "Barbearia Esquina",
    link: "https://barbearia.kriai.online",
    rotuloLink: "Ver o modelo no ar",
    precos: [
      ["Corte", "R$ 45"],
      ["Barba", "R$ 35"],
      ["Corte + barba", "R$ 70"],
    ],
    texto: "",
    botao: "Agendar pelo WhatsApp",
    foto: {
      src: "/modelos/barbearia-esquina.jpg",
      alt: "Modelo de site Barbearia Esquina: título Corte em dia, sem fila no sábado, ao lado de um poste de barbeiro listrado e da placa verde com o horário",
      credito: "https://barbearia.kriai.online",
    },
  },
  {
    id: "confeitaria",
    rotulo: "Confeitaria",
    legenda:
      "O cliente monta o bolo, vê a prévia e o preço na hora, e a encomenda chega pronta no WhatsApp.",
    titulo: "Glacê Ateliê de Bolos",
    link: "https://bolos.kriai.online",
    rotuloLink: "Ver o modelo no ar",
    precos: [],
    texto:
      "Encomendas com 3 dias de antecedência. Retirada ou entrega no bairro.",
    botao: "Fazer encomenda",
    foto: {
      src: "/modelos/glace-bolos.jpg",
      alt: "Modelo de site Glacê Ateliê de Bolos: título Bolo de festa do jeito que você imaginou, ao lado de um bolo de dois andares ilustrado em corte",
      credito: "https://bolos.kriai.online",
    },
  },
  {
    id: "fisioterapia",
    rotulo: "Clínica",
    legenda:
      "Passa confiança antes da primeira consulta e mostra os convênios.",
    titulo: "Volte a se mexer sem dor",
    precos: [],
    texto:
      "Avaliação de 50 minutos, plano de tratamento por escrito e convênios aceitos.",
    botao: "Agendar avaliação",
    foto: {
      src: "/modelos/fisioterapia.jpg",
      alt: "Fisioterapeuta alongando a perna de um paciente",
      credito:
        "https://www.pexels.com/photo/physiotherapist-exercising-patient-leg-20860588/",
    },
  },
  {
    id: "pizzaria",
    rotulo: "Delivery",
    legenda:
      "Cardápio, horário e pedido em um toque, sem pagar comissão de aplicativo.",
    titulo: "Massa de 48 horas, forno a lenha",
    precos: [],
    texto:
      "Peça pelo WhatsApp e acompanhe a entrega. Terça a domingo, das 18h às 23h.",
    botao: "Pedir agora",
    foto: {
      src: "/modelos/pizzaria.jpg",
      alt: "Pizza napolitana saindo do forno a lenha",
      credito: "https://www.pexels.com/photo/pizza-in-an-oven-10406184/",
    },
  },
] as const;

/**
 * [SUBSTITUIR] Depoimentos DE TESTE, só para alinhar o layout. Os negócios e as pessoas são fictícios.
 * Antes de publicar, troque por depoimentos reais (com autorização) e mude `teste` para false.
 * Enquanto `teste` for true, o card mostra o selo "exemplo".
 */
export const depoimentos = [
  {
    teste: true,
    nome: "Marina Lopes",
    negocio: "Doce Ateliê Marina",
    cidade: "Campinas/SP",
    servico: "Site + logo",
    texto:
      "Eu vendia só pelo Instagram e vivia respondendo preço no direct. Agora mando o link do site e a encomenda já chega pronta no WhatsApp.",
  },
  {
    teste: true,
    nome: "Rafael Nunes",
    negocio: "Barbearia Navalha Fina",
    cidade: "Recife/PE",
    servico: "Site + Google",
    texto:
      "Vi o preço antes de fechar e paguei metade só depois de aprovar a prévia. Em uma semana o pessoal começou a me achar no Google Maps.",
  },
  {
    teste: true,
    nome: "Clara Teixeira",
    negocio: "Movimento Fisioterapia",
    cidade: "Belo Horizonte/MG",
    servico: "Vídeo",
    texto:
      "Gravei com o celular seguindo o roteiro que mandaram. O vídeo voltou editado, com legenda, e virou o post com mais agendamentos do mês.",
  },
] as const;
