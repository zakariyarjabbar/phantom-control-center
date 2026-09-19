import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "PHANTOM — Control Center",
  description:
    "A fictional signal intelligence workstation. Discover transmissions, trace a global network, and uncover the stories between stations.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
const contract = `<!-- THESIS: An instrument for discovering a network that remembers. OWN-WORLD: near-black green ground, phosphor selections, measured mono telemetry, dotted geographic silhouettes, restrained amber. STORY: scan, tune, decode, reveal, trace, read. FIRST VIEWPORT: compact status bar, 70px tool rail, dominant geographic map with telemetry above, right station inspector, terminal and event feed below. FORM: cinematic specialist workstation; brief-pinned; seed de01ca31. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->`;
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <div dangerouslySetInnerHTML={{ __html: contract }} />
        {children}
      </body>
    </html>
  );
}
