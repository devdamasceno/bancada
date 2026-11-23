/**
 * Robô da Kriai, desenhado como impressão em CMYK fora de registro (o mesmo jeito do K da marca).
 * Ilustração própria em SVG, usada como fundo da seção principal.
 */
function Corpo() {
  return (
    <>
      {/* antena */}
      <path d="M300 104V64" />
      <circle cx="300" cy="50" r="14" />
      {/* orelhas */}
      <rect x="112" y="178" width="34" height="96" rx="14" />
      <rect x="454" y="178" width="34" height="96" rx="14" />
      {/* cabeça e tela do rosto */}
      <rect x="146" y="104" width="308" height="236" rx="56" />
      <rect x="184" y="146" width="232" height="152" rx="34" />
      {/* olhos e sorriso */}
      <circle cx="254" cy="212" r="20" />
      <circle cx="346" cy="212" r="20" />
      <path d="M262 258q38 30 76 0" />
      {/* pescoço e corpo */}
      <path d="M272 340v28h56v-28" />
      <rect x="164" y="368" width="272" height="206" rx="46" />
      {/* painel do peito: um K */}
      <rect x="244" y="410" width="112" height="112" rx="22" />
      <path d="M282 440v52M282 468l26-28M290 462l20 30" />
      {/* braço acenando e braço apoiado */}
      <path d="M436 420c46-6 70-40 78-92" />
      <circle cx="518" cy="312" r="18" />
      <path d="M164 420c-40 16-58 54-56 102" />
      <circle cx="108" cy="540" r="18" />
    </>
  );
}

export function RoboFundo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 620 620" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="robo-retícula" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="5" cy="5" r="2.1" fill="#ff2e98" />
        </pattern>
      </defs>
      {/* retícula magenta dentro da tela do rosto e do painel */}
      <rect x="190" y="152" width="220" height="140" rx="30" fill="url(#robo-retícula)" opacity=".55" />
      <rect x="250" y="416" width="100" height="100" rx="18" fill="url(#robo-retícula)" opacity=".4" />
      <g fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" style={{ mixBlendMode: "multiply" }}>
        <g stroke="var(--ciano, #00A3E0)" transform="translate(-9 6)">
          <Corpo />
        </g>
        <g stroke="#ff2e98" transform="translate(8 -6)">
          <Corpo />
        </g>
        <g stroke="var(--amarelo, #FFE100)" transform="translate(3 10)">
          <Corpo />
        </g>
      </g>
    </svg>
  );
}

export function InstagramIcone() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcone() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M12 2.2A9.7 9.7 0 0 0 3.7 17l-1.3 4.8 4.9-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.2.2-.6.2-1 .1-1.2l-.5-.4Z" />
    </svg>
  );
}
