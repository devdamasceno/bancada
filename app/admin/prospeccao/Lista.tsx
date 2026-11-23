"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import type { StatusProspect } from "@/lib/prospeccao";
import { enviadoNaAbordagem, statusNaAbordagem } from "./acoes";
import {
  IcoBusca,
  IcoChama,
  IcoCoracao,
  IcoEnviado,
  IcoEstrela,
  IcoInstagram,
  IcoLimpar,
  IcoLink,
  IcoLista,
  IcoLixo,
  IcoMapa,
  IcoNovo,
  IcoRelogio,
  IcoRetorno,
  IcoTelefone,
  IcoTrofeu,
  IcoWhats,
} from "./Icones";

/** Lead como chega do servidor, já com as mensagens de WhatsApp montadas. */
export type LeadTela = {
  id: string;
  nome: string;
  segmento: string;
  local: string;
  endereco: string | null;
  telefone: string | null;
  celular: boolean;
  instagram: string | null;
  site: string | null;
  maps: string | null;
  nota: number | null;
  avaliacoes: number | null;
  ultimaAvaliacao: string | null;
  pontuacao: number;
  motivos: string[];
  status: StatusProspect;
  tentativas: number;
  contatadoEm: string | null;
  criadoEm: string;
  zapPrimeira: string | null;
  zapRetorno: string | null;
};

const DIA = 86_400_000;
const DIAS_RETORNO = 2;

/* ---------- categorias do atendimento ---------- */

type Categoria = "todos" | "contatar" | "retornar" | "aguardando" | "interessado" | "cliente" | "descartado";

function categoria(l: LeadTela, agora: number): Exclude<Categoria, "todos"> {
  if (l.status === "novo") return "contatar";
  if (l.status === "contatado") {
    const vencido = l.contatadoEm && agora - new Date(l.contatadoEm).getTime() >= DIAS_RETORNO * DIA;
    return l.tentativas < 2 && vencido ? "retornar" : "aguardando";
  }
  return l.status;
}

const CATEGORIAS: { id: Categoria; rotulo: string; dica: string; icone: ReactNode }[] = [
  { id: "todos", rotulo: "Todos", dica: "Todos os leads, menos os descartados", icone: <IcoLista /> },
  { id: "contatar", rotulo: "A contatar", dica: "Ainda não receberam mensagem", icone: <IcoNovo /> },
  { id: "retornar", rotulo: "Retornar", dica: `Primeira mensagem há ${DIAS_RETORNO} dias ou mais, sem resposta`, icone: <IcoRetorno /> },
  { id: "aguardando", rotulo: "Aguardando", dica: "Mensagem enviada, esperando resposta", icone: <IcoRelogio /> },
  { id: "interessado", rotulo: "Interessados", dica: "Responderam com interesse", icone: <IcoCoracao /> },
  { id: "cliente", rotulo: "Clientes", dica: "Viraram clientes", icone: <IcoTrofeu /> },
  { id: "descartado", rotulo: "Descartados", dica: "Sem interesse ou já têm site", icone: <IcoLixo /> },
];

const ROTULO_STATUS: Record<StatusProspect, string> = {
  novo: "Novo",
  contatado: "Contatado",
  interessado: "Interessado",
  descartado: "Descartado",
  cliente: "Cliente",
};

function temperatura(p: number) {
  if (p >= 85) return { classe: "quente", rotulo: "Quente" };
  if (p >= 70) return { classe: "morno", rotulo: "Morno" };
  return { classe: "frio", rotulo: "Frio" };
}

function haQuanto(iso: string, agora: number) {
  const dias = Math.floor((agora - new Date(iso).getTime()) / DIA);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

/** Sem acento e em minúsculas, para a busca achar "salao" em "Salão". */
const normal = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

type Ordem = "pontuacao" | "recentes" | "nome";

export function ListaLeads({ leads: iniciais, segmentoInicial, localInicial }: { leads: LeadTela[]; segmentoInicial?: string; localInicial?: string }) {
  const [leads, setLeads] = useState(iniciais);
  const [aba, setAba] = useState<Categoria>("todos");
  const [texto, setTexto] = useState("");
  const [segmento, setSegmento] = useState(segmentoInicial ?? "");
  const [local, setLocal] = useState(localInicial ?? "");
  const [soWhats, setSoWhats] = useState(false);
  const [soInsta, setSoInsta] = useState(false);
  const [soQuente, setSoQuente] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>("pontuacao");
  const [aviso, setAviso] = useState<string | null>(null);
  const [, iniciar] = useTransition();
  const [agora] = useState(() => Date.now());

  const segmentos = useMemo(() => [...new Set(leads.map((l) => l.segmento))].sort(), [leads]);
  const locais = useMemo(() => [...new Set(leads.map((l) => l.local))].sort(), [leads]);

  // filtros que não são a aba: valem para a lista e para os contadores das abas
  const filtrados = useMemo(() => {
    const t = normal(texto.trim());
    return leads.filter(
      (l) =>
        (!segmento || l.segmento === segmento) &&
        (!local || l.local === local) &&
        (!soWhats || l.celular) &&
        (!soInsta || !!l.instagram) &&
        (!soQuente || l.pontuacao >= 85) &&
        (!t || normal(`${l.nome} ${l.endereco ?? ""} ${l.telefone ?? ""}`).includes(t)),
    );
  }, [leads, texto, segmento, local, soWhats, soInsta, soQuente]);

  const contagem = useMemo(() => {
    const c: Record<Categoria, number> = { todos: 0, contatar: 0, retornar: 0, aguardando: 0, interessado: 0, cliente: 0, descartado: 0 };
    for (const l of filtrados) {
      const cat = categoria(l, agora);
      c[cat]++;
      if (cat !== "descartado") c.todos++;
    }
    return c;
  }, [filtrados, agora]);

  const visiveis = useMemo(() => {
    const lista = filtrados.filter((l) => {
      const cat = categoria(l, agora);
      return aba === "todos" ? cat !== "descartado" : cat === aba;
    });
    return lista.sort((a, b) =>
      ordem === "nome"
        ? a.nome.localeCompare(b.nome, "pt-BR")
        : ordem === "recentes"
          ? b.criadoEm.localeCompare(a.criadoEm)
          : b.pontuacao - a.pontuacao,
    );
  }, [filtrados, aba, ordem, agora]);

  const filtrando = texto || segmento || local || soWhats || soInsta || soQuente;
  const limpar = () => {
    setTexto("");
    setSegmento("");
    setLocal("");
    setSoWhats(false);
    setSoInsta(false);
    setSoQuente(false);
  };

  function atualizar(id: string, mudanca: Partial<LeadTela>) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...mudanca } : l)));
  }

  /** Clique no WhatsApp: abre a conversa (pelo link) e marca o envio no banco. */
  function enviou(l: LeadTela) {
    const antes = { status: l.status, tentativas: l.tentativas, contatadoEm: l.contatadoEm };
    atualizar(l.id, {
      status: l.status === "novo" ? "contatado" : l.status,
      tentativas: l.tentativas + 1,
      contatadoEm: new Date().toISOString(),
    });
    setAviso(`${l.nome} marcado como contatado.`);
    iniciar(async () => {
      try {
        await enviadoNaAbordagem(l.id);
      } catch {
        atualizar(l.id, antes);
        setAviso(`Não consegui marcar ${l.nome}. Mude a situação na mão.`);
      }
    });
  }

  function mudarStatus(l: LeadTela, status: StatusProspect) {
    const antes = l.status;
    atualizar(l.id, { status });
    setAviso(`${l.nome}: ${ROTULO_STATUS[status].toLowerCase()}.`);
    iniciar(async () => {
      try {
        await statusNaAbordagem(l.id, status);
      } catch {
        atualizar(l.id, { status: antes });
        setAviso(`Não consegui salvar ${l.nome}. Tente de novo.`);
      }
    });
  }

  return (
    <section className="pl">
      <div className="pl-filtros" role="search">
        <label className="pl-texto">
          <IcoBusca />
          <span className="sr-only">Buscar por nome, endereço ou telefone</span>
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Nome, endereço ou telefone" />
        </label>
        <select value={segmento} onChange={(e) => setSegmento(e.target.value)} aria-label="Segmento">
          <option value="">Todos os segmentos</option>
          {segmentos.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={local} onChange={(e) => setLocal(e.target.value)} aria-label="Local">
          <option value="">Todos os locais</option>
          {locais.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} aria-label="Ordenar">
          <option value="pontuacao">Maior pontuação</option>
          <option value="recentes">Mais recentes</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
      </div>

      <div className="pl-chips" aria-label="Filtros rápidos">
        <button type="button" aria-pressed={soWhats} onClick={() => setSoWhats((v) => !v)}>
          <IcoWhats /> Celular (WhatsApp)
        </button>
        <button type="button" aria-pressed={soInsta} onClick={() => setSoInsta((v) => !v)}>
          <IcoInstagram /> Com Instagram
        </button>
        <button type="button" aria-pressed={soQuente} onClick={() => setSoQuente((v) => !v)}>
          <IcoChama /> Só quentes
        </button>
        {filtrando && (
          <button type="button" className="pl-limpar" onClick={limpar}>
            <IcoLimpar /> Limpar filtros
          </button>
        )}
      </div>

      <nav className="pl-abas" aria-label="Etapa do atendimento">
        {CATEGORIAS.map((c) => (
          <button key={c.id} type="button" aria-pressed={aba === c.id} title={c.dica} onClick={() => setAba(c.id)} className={`aba-${c.id}`}>
            {c.icone}
            {c.rotulo}
            <span className="pl-conta">{contagem[c.id]}</span>
          </button>
        ))}
      </nav>

      <p className="pl-aviso" role="status" aria-live="polite">
        {aviso ?? `${visiveis.length} ${visiveis.length === 1 ? "lead" : "leads"} nesta lista`}
      </p>

      {visiveis.length === 0 ? (
        <p className="adm-vazio">
          {leads.length === 0 ? "Nenhum lead ainda. Faça uma busca acima." : "Nenhum lead com esses filtros nesta etapa."}
        </p>
      ) : (
        <ul className="pl-lista">
          {visiveis.map((l) => (
            <Cartao key={l.id} l={l} agora={agora} onEnviou={() => enviou(l)} onStatus={(s) => mudarStatus(l, s)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Cartao({ l, agora, onEnviou, onStatus }: { l: LeadTela; agora: number; onEnviou: () => void; onStatus: (s: StatusProspect) => void }) {
  const temp = temperatura(l.pontuacao);
  const cat = categoria(l, agora);
  const zap = l.tentativas >= 1 ? l.zapRetorno : l.zapPrimeira;
  const rotuloZap = l.tentativas >= 1 ? "Mandar retorno" : "Chamar no WhatsApp";

  return (
    <li className={`pl-item cat-${cat}`}>
      <div className={`pl-nota t-${temp.classe}`} title={`Pontuação ${l.pontuacao} de 100`}>
        <strong>{l.pontuacao}</strong>
        <span>{temp.rotulo}</span>
      </div>

      <div className="pl-corpo">
        <div className="pl-titulo">
          <h2>{l.nome}</h2>
          <span className={`pl-badge st-${l.status}`}>{ROTULO_STATUS[l.status]}</span>
        </div>
        <p className="pl-meta">
          <span>{l.segmento}</span>
          <span>
            <IcoMapa tamanho={13} /> {l.local}
          </span>
          {l.nota ? (
            <span>
              <IcoEstrela tamanho={13} /> {l.nota.toLocaleString("pt-BR")} ({l.avaliacoes ?? 0})
            </span>
          ) : (
            <span>sem avaliações</span>
          )}
          {l.ultimaAvaliacao && <span>última avaliação {haQuanto(l.ultimaAvaliacao, agora)}</span>}
        </p>
        {l.endereco && <p className="pl-endereco">{l.endereco}</p>}

        <ul className="pl-badges" aria-label="Sinais do lead">
          {l.celular ? (
            <li className="b-zap">
              <IcoWhats tamanho={13} /> WhatsApp
            </li>
          ) : (
            <li className="b-fixo">
              <IcoTelefone tamanho={13} /> Só fixo
            </li>
          )}
          {l.instagram && (
            <li className="b-insta">
              <IcoInstagram tamanho={13} /> Instagram
            </li>
          )}
          {l.contatadoEm && (
            <li className={cat === "retornar" ? "b-retorno" : "b-enviado"}>
              <IcoEnviado tamanho={13} /> {l.tentativas >= 2 ? "2 mensagens" : "1ª mensagem"} {haQuanto(l.contatadoEm, agora)}
            </li>
          )}
          {l.motivos
            .filter((m) => !/celular|whatsapp|instagram|telefone/i.test(m))
            .map((m) => (
              <li key={m}>{m}</li>
            ))}
        </ul>

        <div className="pl-acoes">
          {zap && l.status !== "descartado" && l.status !== "cliente" && (
            <a className="pl-botao zap" href={zap} target="_blank" rel="noopener noreferrer" onClick={onEnviou}>
              <IcoWhats /> {rotuloZap}
            </a>
          )}
          {l.telefone && !l.celular && (
            <a className="pl-botao" href={`tel:${l.telefone.replace(/\D/g, "")}`}>
              <IcoTelefone /> Ligar {l.telefone}
            </a>
          )}
          {l.instagram ? (
            <a className="pl-botao" href={l.instagram} target="_blank" rel="noopener noreferrer">
              <IcoInstagram /> Instagram
            </a>
          ) : (
            <a
              className="pl-botao"
              href={`https://www.google.com/search?q=${encodeURIComponent(`${l.nome} ${l.local} instagram`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IcoBusca /> Achar Instagram
            </a>
          )}
          {l.site && !l.instagram && (
            <a className="pl-botao" href={l.site} target="_blank" rel="noopener noreferrer">
              <IcoLink /> Link do perfil
            </a>
          )}
          {l.maps && (
            <a className="pl-botao" href={l.maps} target="_blank" rel="noopener noreferrer">
              <IcoMapa /> Maps
            </a>
          )}
        </div>
      </div>

      <div className="pl-status">
        <label>
          <span className="sr-only">Situação de {l.nome}</span>
          <select value={l.status} onChange={(e) => onStatus(e.target.value as StatusProspect)}>
            {(Object.keys(ROTULO_STATUS) as StatusProspect[]).map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS[s]}
              </option>
            ))}
          </select>
        </label>
        {l.status === "contatado" && (
          <button type="button" className="pl-mini ok" onClick={() => onStatus("interessado")}>
            <IcoCoracao tamanho={14} /> Interessado
          </button>
        )}
        {l.status !== "descartado" && l.status !== "cliente" && (
          <button type="button" className="pl-mini" onClick={() => onStatus("descartado")}>
            <IcoLixo tamanho={14} /> Descartar
          </button>
        )}
      </div>
    </li>
  );
}
