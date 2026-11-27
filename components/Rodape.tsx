import Link from "next/link";
import { landing as t } from "@/content/landing";
import { marca, servicos } from "@/content/site";
import { whatsappDoEstudio } from "@/lib/whatsapp";
import { BotaoPreferencias } from "@/components/BotaoPreferencias";
import { BarraDeCores } from "@/components/Grafica";
import { Logo } from "@/components/Marca";

const real = (v: string) => !!v && !v.includes("[SUBSTITUIR]");

/** Rodapé padrão de todas as páginas públicas. */
export function Rodape() {
  const zap = whatsappDoEstudio(t.whatsappMensagem);
  return (
    <footer className="rodape">
      <BarraDeCores cores={["#00A3E0", "#D4006F", "#FFE100", "#FFFFFF"]} />
      <div className="largura">
        <div className="rodape-grade">
          <div>
            <Logo claro />
            <p className="rodape-slogan">{marca.slogan}</p>
          </div>
          <div>
            <h2 className="rodape-titulo">{t.rodape.servicos}</h2>
            <ul>
              {servicos.map((s) => (
                <li key={s.id}>
                  <Link href="/#precos">{s.nome}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="rodape-titulo">{t.rodape.agencia}</h2>
            <ul>
              {t.nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.rotulo}</Link>
                </li>
              ))}
              <li>
                <Link href="/criacao-de-sites-juiz-de-fora">Criação de sites em Juiz de Fora</Link>
              </li>
              <li>
                <Link href="/privacidade">{t.rodape.privacidade}</Link>
              </li>
              <li>
                <BotaoPreferencias rotulo={t.rodape.cookies} />
              </li>
            </ul>
          </div>
          <div>
            <h2 className="rodape-titulo">{t.rodape.contato}</h2>
            <ul>
              {zap && (
                <li>
                  <a href={zap} target="_blank" rel="noopener">
                    WhatsApp {marca.whatsapp}
                  </a>
                </li>
              )}
              {real(marca.instagram) && (
                <li>
                  <a href={`https://instagram.com/${marca.instagram}`} target="_blank" rel="noopener">
                    Instagram @{marca.instagram}
                  </a>
                </li>
              )}
              {real(marca.email) && (
                <li>
                  <a href={`mailto:${marca.email}`}>{marca.email}</a>
                </li>
              )}
              <li className="rodape-cidade">{marca.cidade}, atendimento 100% online</li>
            </ul>
          </div>
        </div>
        <div className="rodape-base">
          <span>
            © {marca.ano} {marca.nome}.{real(marca.cnpj) ? ` CNPJ ${marca.cnpj}.` : ""}
          </span>
          <span>{t.rodape.assinatura}</span>
        </div>
      </div>
    </footer>
  );
}
