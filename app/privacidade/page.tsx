import type { Metadata } from "next";
import Link from "next/link";
import { consentimento, marca, secaoDados } from "@/content/site";
import { BotaoPreferencias } from "@/components/BotaoPreferencias";
import { Topo } from "@/components/Marca";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = {
  title: "Privacidade e cookies",
  description: `Como ${marca.nome} coleta, usa e guarda seus dados.`,
  alternates: { canonical: "/privacidade" },
  openGraph: {
    title: "Privacidade e cookies",
    description: `Como ${marca.nome} coleta, usa e guarda seus dados.`,
    url: "/privacidade",
    siteName: "Kriai",
    locale: "pt_BR",
    type: "website",
  },
};

// [SUBSTITUIR] Revise este texto com um advogado antes de publicar.
export default function Privacidade() {
  return (
    <>
      <Topo />
      <main className="politica">
        <p>
          <Link href="/">Voltar ao início</Link>
        </p>
        <h1>Privacidade e cookies</h1>
        <p className="rotulo">Versão {consentimento.versao}</p>

        <h2>Quem cuida dos seus dados</h2>
        <p>
          {marca.nome}, {marca.cnpj && `CNPJ ${marca.cnpj}, `}{marca.cidade}. Para pedir acesso,
          correção ou exclusão dos seus dados, escreva para {marca.email}.
          Respondemos em até 15 dias, como prevê a LGPD (Lei 13.709/2018).
        </p>

        <h2>O que coletamos e por quê</h2>
        <ul>
          {secaoDados.guardamos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p>
          A conversa e a ficha servem para entender o que você precisa e
          preparar seu orçamento, inclusive quando você não chega a enviar o
          pedido (base legal: procedimentos preliminares de contrato a pedido do
          titular e legítimo interesse). Podemos entrar em contato pelo WhatsApp
          ou e-mail que você informou na conversa só para tratar desse
          orçamento. Ofertas e novidades só chegam se você marcar essa opção. Os
          dados de análise servem para melhorar o site (base legal:
          consentimento).
        </p>

        <h2>Quem processa os dados com a gente</h2>
        <ul>
          <li>
            <strong>Anthropic</strong> (assistente de IA Claude): recebe as
            mensagens da conversa para gerar as respostas.
          </li>
          <li>
            <strong>Supabase</strong>: guarda as conversas e os pedidos em
            servidor no Brasil (São Paulo).
          </li>
          <li>
            <strong>Vercel</strong>: hospeda o site.
          </li>
        </ul>

        <h2>O que não fazemos</h2>
        <ul>
          {secaoDados.naoGuardamos.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <h2>Cookies e armazenamento no navegador</h2>
        <ul>
          <li>
            <strong>kriai_consent</strong>: guarda sua escolha de cookies por 1
            ano. Necessário.
          </li>
          <li>
            <strong>kriai_conversa</strong>: código da sua conversa. Enquanto a
            aba estiver aberta, é necessário. Com permissão de personalização,
            fica guardado para você continuar em outra visita.
          </li>
          <li>
            <strong>kriai_vid</strong>: identificador anônimo deste navegador
            por 1 ano. Só com permissão de análise.
          </li>
        </ul>
        <BotaoPreferencias rotulo="Mudar preferências de cookies" />

        <h2>Por quanto tempo guardamos</h2>
        <p>
          [SUBSTITUIR] Conversas e pedidos: até 2 anos após o último contato.
          Dados de análise: até 12 meses. Você pode pedir a exclusão antes disso
          a qualquer momento.
        </p>
      </main>
      <Rodape />
    </>
  );
}
