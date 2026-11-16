// Textos da página inicial (landing). Os preços e prazos vêm de content/site.ts (servicos), as perguntas
// frequentes de content/atendente.ts: mude lá e a página acompanha.
// Itens com [SUBSTITUIR] precisam de dado real antes de publicar.

export const landing = {
  titulo: "Seu negócio pronto para vender na internet.",
  linhaPreco: "site, vídeo, logo e Google, a partir de R$ 147",
  subtitulo: "A Kria entende seu negócio e mostra o preço em 2 minutos.",
  subtituloDestaque: "Uma pessoa da equipe manda a proposta, e você paga a primeira metade só se aprovar.",
  botao: "Montar meu plano com a Kria",
  botaoApoio: "Grátis e sem cadastro. Você vê o preço antes de decidir.",
  provas: ["50% só depois de aprovar", "Preço aberto, sem surpresa", "1 rodada de ajustes inclusa"],
  whatsappMensagem: "Oi! Vim pelo site da Kriai e quero um orçamento.",

  modelos: {
    titulo: "Veja como fica o site de quem vende o que você vende",
    texto:
      "Cada modelo nasce do negócio: as cores da barbearia não servem para a confeitaria. O seu sai com a sua cara, o seu preço e o botão de WhatsApp no lugar certo.",
    botao: "Quero um desses para o meu negócio",
    botaoApoio: "A Kria pergunta o essencial e mostra o preço",
  },

  precos: {
    titulo: "Quanto custa, sem precisar pedir orçamento",
    texto: "Preço de entrada de cada serviço. Dá para começar por um e somar os outros depois.",
    rodape: "Pix ou cartão em até 3x. Domínio e hospedagem do site são à parte e vêm explicados na proposta.",
  },

  comoFunciona: {
    titulo: "Do primeiro oi ao site no ar",
    passos: [
      { titulo: "Você conversa com a Kria", texto: "Ela entende o seu negócio, monta o plano e mostra o preço. Leva uns 2 minutos." },
      { titulo: "A proposta chega em até 1 dia útil", texto: "Uma pessoa da equipe revisa o pedido e manda a proposta pelo WhatsApp ou e-mail." },
      { titulo: "Você aprova e paga 50%", texto: "O trabalho só começa depois que você concorda com o que vai receber e quanto custa." },
      { titulo: "Prévia, ajuste e entrega", texto: "Você vê antes, pede o ajuste e só então paga o restante e recebe a versão final." },
    ],
  },

  duvidas: { titulo: "Perguntas que todo mundo faz" },

  fechamento: {
    titulo: "Em 2 minutos você sabe quanto custa o seu",
    texto: "Escreva do seu jeito, como no WhatsApp. Se não fizer sentido para você, não custa nada.",
  },

  rodape: {
    linhas: ["Site, vídeo, logo e Google para pequenos negócios do Brasil todo, 100% online."],
    privacidade: "Privacidade",
    cookies: "Preferências de cookies",
  },
};

/** Modelos da parede. Fotos em public/modelos (Pexels, licença livre para uso comercial). */
export const modelos = [
  {
    id: "barbearia",
    rotulo: "Barbearia",
    legenda: "Tabela de preços, horários e agenda direto no WhatsApp. É o que o cliente procura antes de sair de casa.",
    titulo: "Corte na hora marcada",
    precos: [
      ["Corte", "R$ 45"],
      ["Barba", "R$ 35"],
      ["Corte + barba", "R$ 70"],
    ],
    texto: "",
    botao: "Agendar pelo WhatsApp",
    foto: { src: "/modelos/barbearia.jpg", alt: "Barbeiro acertando o corte de um cliente com a navalha", credito: "https://www.pexels.com/photo/barber-cutting-person-s-hair-2076930/" },
  },
  {
    id: "confeitaria",
    rotulo: "Confeitaria",
    legenda: "Cardápio com fotos e encomenda pelo WhatsApp, com prazo claro.",
    titulo: "Bolos de festa sob encomenda",
    precos: [],
    texto: "Encomendas com 3 dias de antecedência. Retirada ou entrega no bairro.",
    botao: "Fazer encomenda",
    foto: { src: "/modelos/confeitaria.jpg", alt: "Bolo de aniversário coberto de morangos, mirtilos e velas", credito: "https://www.pexels.com/photo/birthday-cake-1684039/" },
  },
  {
    id: "fisioterapia",
    rotulo: "Clínica",
    legenda: "Passa confiança antes da primeira consulta e mostra os convênios.",
    titulo: "Volte a se mexer sem dor",
    precos: [],
    texto: "Avaliação de 50 minutos, plano de tratamento por escrito e convênios aceitos.",
    botao: "Agendar avaliação",
    foto: { src: "/modelos/fisioterapia.jpg", alt: "Fisioterapeuta alongando a perna de um paciente", credito: "https://www.pexels.com/photo/physiotherapist-exercising-patient-leg-20860588/" },
  },
  {
    id: "pizzaria",
    rotulo: "Delivery",
    legenda: "Cardápio, horário e pedido em um toque, sem pagar comissão de aplicativo.",
    titulo: "Massa de 48 horas, forno a lenha",
    precos: [],
    texto: "Peça pelo WhatsApp e acompanhe a entrega. Terça a domingo, das 18h às 23h.",
    botao: "Pedir agora",
    foto: { src: "/modelos/pizzaria.jpg", alt: "Pizza napolitana saindo do forno a lenha", credito: "https://www.pexels.com/photo/pizza-in-an-oven-10406184/" },
  },
] as const;
