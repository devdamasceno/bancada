import type { Metadata } from "next";
import { Topo } from "@/components/Marca";
import { marca } from "@/content/site";

export const metadata: Metadata = {
  title: { default: "Painel", template: `%s · Painel ${marca.nome}` },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="adm">
      <Topo simples />
      {children}
    </div>
  );
}
