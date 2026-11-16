import Link from "next/link";
import { marca } from "@/content/site";
import { whatsappDoEstudio } from "@/lib/whatsapp";

/** Logo: o nome escrito numa tira de fita crepe, o mesmo material do botão principal. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo-fita" aria-label={`${marca.nome}, página inicial`}>
      <span aria-hidden="true">{marca.nome}</span>
    </Link>
  );
}

/**
 * Cabeçalho padrão de todas as páginas: mesma largura e alinhamento,
 * para a logo nunca mudar de lugar ao navegar. O conteúdo da direita vai em `children`.
 */
export function Topo({ href, children }: { href?: string; children?: React.ReactNode }) {
  return (
    <header className="topo">
      <Logo href={href} />
      <div className="topo-acoes">
        {children}
        <SimboloIA />
      </div>
    </header>
  );
}

/** Símbolo de IA (brilho de quatro pontas) no canto oposto à logo. Leva para a conversa com a Kria. */
export function SimboloIA() {
  return (
    <Link href="/conversa" className="simbolo-ia" aria-label="Conversar com a Kria, assistente de IA">
      <IconeIA />
    </Link>
  );
}

/** Botão de WhatsApp do estúdio. Some sozinho enquanto marca.whatsapp estiver vazio. */
export function BotaoWhatsapp({ texto = "WhatsApp", mensagem }: { texto?: string; mensagem?: string }) {
  const href = whatsappDoEstudio(mensagem);
  if (!href) return null;
  return (
    <a className="botao-zap" href={href} target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.8a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.2.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.6-.4Z"
        />
      </svg>
      {texto}
    </a>
  );
}

/** Ícone de IA: brilho de quatro pontas, grande e pequeno. Usa a cor do texto (currentColor). */
export function IconeIA({ tamanho = 22 }: { tamanho?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M10 2.5c.5 4.3 2.7 6.5 7 7-4.3.5-6.5 2.7-7 7-.5-4.3-2.7-6.5-7-7 4.3-.5 6.5-2.7 7-7Z" />
      <path
        fill="currentColor"
        d="M18.5 13.5c.3 2.2 1.3 3.2 3.5 3.5-2.2.3-3.2 1.3-3.5 3.5-.3-2.2-1.3-3.2-3.5-3.5 2.2-.3 3.2-1.3 3.5-3.5Z"
      />
    </svg>
  );
}
