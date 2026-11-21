// Campanhas reais da Kriai, exibidas em "Em cartaz" (página inicial e /portfolio).
// Itens com [SUBSTITUIR] precisam de dado real antes de publicar.

export type Campanha = {
  id: string;
  titulo: string;
  cliente: string;
  objetivo: string;
  pecas: string;
  /** Endereço da página no ar. null esconde o link. */
  link: string | null;
  rotuloLink: string;
  miniatura: "joao-bala" | "personal";
  /** Captura real da página. Quando existe, substitui a miniatura desenhada. */
  imagem?: { src: string; alt: string; largura: number; altura: number };
  /** Cores da marca do cliente, mostradas na barra de cores da prova. */
  cores: string[];
  /** true mostra o aviso de miniatura ilustrativa. */
  ilustrativa?: boolean;
};

export const campanhas: Campanha[] = [
  {
    id: "joao-bala",
    titulo: "João Bala",
    cliente: "João Bala, consultor de consórcios (@joao_bala)",
    objetivo: "Explicar grupo, parcela e lance sem letra miúda e levar o interessado para o WhatsApp.",
    pecas: "Landing page com grupo de cotas ilustrado, vitrine de cursos e feed do Instagram.",
    link: "https://joaobala.kriai.online",
    rotuloLink: "Ver a página do João",
    miniatura: "joao-bala",
    imagem: {
      src: "/campanhas/joao-bala.jpg",
      alt: "Página do consultor João Bala: título Seu plano de compra, bem pensado do começo ao fim, ao lado da foto dele e de um grupo de cotas",
      largura: 1440,
      altura: 900,
    },
    cores: ["#2F5BFF", "#D4F25A", "#0E1530", "#F6F7FB"],
  },
  {
    id: "rafa-duarte",
    titulo: "Rafa Duarte",
    cliente: "Rafa Duarte, personal trainer em Juiz de Fora e online",
    objetivo: "Transformar seguidor do Instagram em aluno com avaliação marcada.",
    pecas: "Landing page com método, modalidades, planos e agendamento que chega pronto no WhatsApp.",
    link: "https://personal.kriai.online",
    rotuloLink: "Ver a página do Rafa",
    miniatura: "personal",
    imagem: {
      src: "/campanhas/rafa-duarte.jpg",
      alt: "Página do personal Rafa Duarte: título Treino sério, resultado de verdade, ao lado da foto dele de braços cruzados",
      largura: 1440,
      altura: 900,
    },
    cores: ["#FF4D1A", "#0B0B0B", "#262626", "#F2F2F2"],
  },
];
