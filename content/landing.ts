// Textos da página inicial (landing). Os preços e prazos vêm de content/site.ts (servicos), as perguntas
// frequentes de content/atendente.ts: mude lá e a página acompanha.
// Itens com [SUBSTITUIR] precisam de dado real antes de publicar.

export const landing = {
  selo: "Sites para pequenos negócios",
  titulo: "Quando o cliente procurar, ele vai",
  tituloMarca: "achar você.",
  subtitulo:
    "Site com botão de WhatsApp, Perfil no Google e vídeos curtos para pequenos negócios de todo o Brasil.",
  subtituloDestaque: "Você vê o preço na tela e seu site fica no ar no mesmo dia.",
  // botão da seção final ("Fechamento"); o do topo é botaoHero
  botao: "Montar meu plano grátis",
  botaoHero: "Montar meu site",
  botaoSecundario: "Ver modelos",
  nota: "Grátis e sem cadastro para montar o plano · Pix ou cartão em até 3x",
  siga: {
    titulo: "Siga a Kriai",
    texto:
      "Dicas para vender mais na internet, bastidores dos sites que a nossa IA cria e novidades em primeira mão. Siga no Instagram e fale com a gente pelo WhatsApp.",
    instagram: "Seguir @kriai.online",
    whatsapp: "Chamar no WhatsApp",
    curto: "Siga a gente no Instagram",
  },
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
      "Pix ou cartão em até 3x pelo Mercado Pago. A landing page é paga na hora e já sai hospedada em seunegocio.kriai.online. O domínio próprio (.com.br) fica no seu nome no Registro.br, cerca de R$ 40 por ano.",
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
        titulo: "Você combina o site com a Kria",
        texto: "Conte do seu negócio. Ela propõe as seções, o visual e os textos, mostra exemplos e confere se o seu domínio está livre.",
      },
      {
        titulo: "Paga na hora, sem burocracia",
        texto: "Pix ou cartão em até 3x pelo Mercado Pago. O e-mail de boas-vindas chega assim que o pagamento é aprovado.",
      },
      {
        titulo: "A IA cria e publica o site",
        texto: "Nossa IA monta a página com o que vocês combinaram e coloca no ar em seunegocio.kriai.online. Você recebe o link por e-mail.",
      },
      {
        titulo: "Ajuste e domínio próprio",
        texto: "Peça a rodada de ajustes incluída e siga o passo a passo que mandamos para colocar o site no seu domínio.",
      },
    ],
    nota: "Vídeo, logo, Google ou um site maior? A Kria anota tudo e a equipe manda a proposta sem compromisso.",
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
    assinatura: "Atendimento e criação 100% automatizados, acompanhados pela nossa equipe.",
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
    rotulo: "Fisioterapia",
    legenda:
      "O paciente mostra onde dói, escolhe consultório, domicílio ou online e agenda pelo WhatsApp.",
    titulo: "Lívia Prado Fisioterapia",
    link: "https://fisio.kriai.online",
    rotuloLink: "Ver o modelo no ar",
    precos: [],
    texto:
      "Avaliação de 50 minutos, plano de tratamento por escrito e convênios aceitos.",
    botao: "Agendar avaliação",
    foto: {
      src: "/modelos/fisioterapia-modelo.jpg",
      alt: "Modelo de site Lívia Prado Fisioterapia: título Fisioterapia sem fila, no consultório ou na sua casa, ao lado da ilustração da fisioterapeuta",
      credito: "https://fisio.kriai.online",
    },
  },
  {
    id: "pizzaria",
    rotulo: "Delivery",
    legenda:
      "Pizza meio a meio montada na tela, sacola, taxa por bairro e pedido direto no WhatsApp, sem comissão de aplicativo.",
    titulo: "Forno da Vila Pizzaria",
    link: "https://pizzaria.kriai.online",
    rotuloLink: "Ver o modelo no ar",
    precos: [],
    texto:
      "Peça pelo WhatsApp e acompanhe a entrega. Terça a domingo, das 18h às 23h.",
    botao: "Pedir agora",
    foto: {
      src: "/modelos/pizzaria-modelo.jpg",
      alt: "Modelo de site Forno da Vila Pizzaria: título Massa de 48 horas, forno a lenha, ao lado de uma pizza meio a meio ilustrada",
      credito: "https://pizzaria.kriai.online",
    },
  },
  {
    id: "corretor",
    rotulo: "Corretor de imóveis",
    legenda:
      "Galeria de imóveis com fotos, filtro de comprar ou alugar e painel para o corretor cadastrar tudo sozinho. O interesse chega no WhatsApp com todos os dados do imóvel.",
    titulo: "Marina Duarte Imóveis",
    link: "https://corretor.kriai.online",
    rotuloLink: "Ver o modelo no ar",
    precos: [],
    texto:
      "Casas, apartamentos, salas e terrenos para comprar ou alugar. Visita marcada pelo WhatsApp.",
    botao: "Agendar visita",
    foto: {
      src: "/modelos/corretor-modelo.jpg",
      alt: "Modelo de site Marina Duarte Imóveis: título Casa, apartamento ou sala em Juiz de Fora, ao lado de uma placa vermelha de Vende e Aluga pendurada",
      credito: "https://corretor.kriai.online",
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
