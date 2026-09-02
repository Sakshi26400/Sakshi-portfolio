import "./globals.css";

export const metadata = {
  title: "Sakshi Sakle | Product, AI & Technology",
  description:
    "Product-focused technology professional with experience across enterprise software, AI strategy, data and business management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
