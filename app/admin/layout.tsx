import type { Metadata } from "next";
import Link from "next/link";
import { marca } from "@/content/site";

export const metadata: Metadata = {
  title: { default: "Painel", template: `%s · Painel ${marca.nome}` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="adm">
      <header className="adm-topo">
        <Link href="/admin" className="adm-marca">
          {marca.nome} <span className="rotulo">painel</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
