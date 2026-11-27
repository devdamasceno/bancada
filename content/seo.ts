// Textos para o Google e para o compartilhamento de links. Mude aqui e o site todo acompanha.
// Dica: título com até ~60 caracteres e descrição com até ~155, com as palavras que o cliente digita na busca.

export const seo = {
  titulo: "Criação de sites em Juiz de Fora e todo o Brasil | Kriai",
  descricao:
    "Criação de sites para pequenos negócios em Juiz de Fora (MG) e todo o Brasil. Landing page com WhatsApp a partir de R$ 397, no ar no mesmo dia. Pix ou cartão em até 3x.",
  /** Descrição curta que aparece ao compartilhar o link (WhatsApp, Instagram, Facebook). */
  descricaoCompartilhar: "Site, vídeo, logo e Google para pequenos negócios. Landing page no ar no mesmo dia, com Pix ou cartão em até 3x.",
  chamadaImagem: "Propaganda de agência, no tamanho do seu negócio.",
  apoioImagem: "Site, vídeo, logo e Google. Landing page no ar no mesmo dia.",
  /** Área atendida (o serviço é 100% online). */
  area: "Brasil",
  /** Cidade-base, para a busca local ("criação de sites em Juiz de Fora"). */
  cidade: { nome: "Juiz de Fora", estado: "MG", estadoNome: "Minas Gerais" },
  /** Código de verificação do Google Search Console (opcional; também dá para verificar pelo DNS). */
  googleVerificacao: process.env.GOOGLE_SITE_VERIFICATION || undefined,
};
