"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "News & Awards", href: "/news" },
  { label: "Project Showcase", href: "/projects" },
  { label: "Publications", href: "/publications" },
  { label: "Lab Locations", href: "/locations" },
  { label: "Contact", href: "/contact" },
  { label: "Gallery", href: "/gallery" },
  { label: "Lucky Seal", href: "/lucky-seal" },
  { label: "People", href: "/people" },
  { label: "Partner Organizations", href: "/partners" },
  { label: "Apply", href: "/apply" },
];

export default function Navbar() {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync React state with the native details toggle (for header bg)
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handler = () => setMenuOpen(el.open);
    el.addEventListener("toggle", handler);
    return () => el.removeEventListener("toggle", handler);
  }, []);

  // Close menu on route change
  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  return (
    <header
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
      className={`transition-colors duration-300 ${
        scrolled || menuOpen ? "bg-[#0e0a14]/95 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/seal-icon.svg"
              alt="SEAL icon"
              width={36}
              height={36}
              className="h-9 w-9 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-white font-bold text-xl tracking-widest hidden sm:block">
              SEAL
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm rounded-md transition-all duration-150 whitespace-nowrap ${
                  pathname === link.href
                    ? "text-white bg-white/[0.08]"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile: native <details> toggle — no JS required to open/close */}
          <details ref={detailsRef} className="lg:hidden mobile-nav-details">
            <summary className="mobile-nav-summary" aria-label="Toggle menu">
              {/* Hamburger lines — animated via CSS [open] selector */}
              <span className="mobile-nav-bar bar1" />
              <span className="mobile-nav-bar bar2" />
              <span className="mobile-nav-bar bar3" />
            </summary>

            {/* Dropdown — position:fixed so it escapes the header's flow */}
            <nav className="mobile-nav-dropdown">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-nav-link ${pathname === link.href ? "active" : ""}`}
                  onClick={() => {
                    if (detailsRef.current) detailsRef.current.open = false;
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>

        </div>
      </div>
    </header>
  );
}
