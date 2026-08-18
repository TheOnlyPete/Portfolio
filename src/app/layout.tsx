import type { Metadata } from "next";
import "./portfolio.css";

export const metadata: Metadata = {
  title: "Peter Murphy — Software Engineer",
  description: "Portfolio of Peter Murphy, a software engineer building useful systems, developer tools and interactive experiences.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
