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
    // [SUBSTITUIR] Troque pelo domínio próprio: o endereço .vercel.app está com o login da Vercel ativado.
    link: "https://joao-bala-site.vercel.app/",
    rotuloLink: "Ver a página do João",
    miniatura: "joao-bala",
    cores: ["#2F5BFF", "#D4F25A", "#0E1530", "#F6F7FB"],
  },
  {
    id: "personal",
    titulo: "Personal trainer",
    cliente: "[SUBSTITUIR: nome e @ do personal]",
    objetivo: "Transformar seguidor do Instagram em aluno com avaliação marcada.",
    pecas: "Landing page de captação com método, planos e agendamento pelo WhatsApp.",
    link: null, // [SUBSTITUIR] endereço da landing do personal
    rotuloLink: "Ver a página",
    miniatura: "personal",
    cores: ["#FF5A1F", "#141414", "#2A2A2A", "#F4F1EC"],
    ilustrativa: true,
  },
];
