import "./globals.css";
import FoodBackground3D from "@/components/FoodBackground3D";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Шеф из того, что есть дома",
  description: "Рецепт ужина из продуктов, которые уже лежат на кухне",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,400;0,500;0,600;0,700;0,800&display=swap&subset=cyrillic,latin"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const t = localStorage.getItem("shef-theme"); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; } catch {} })();`,
          }}
        />
      </head>
      <body>
        <FoodBackground3D />
        <div className="app-shell">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
