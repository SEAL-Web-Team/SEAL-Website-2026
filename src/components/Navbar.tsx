"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type SimpleLink = { label: string; href: string };

// Flat list, no dropdowns — every page gets its own top-level link.
// "Apply" is rendered separately as a CTA.
const navItems: SimpleLink[] = [
  { label: "Home", href: "/" },
  { label: "News", href: "/news" },
  { label: "Publications", href: "/publications" },
  { label: "Projects", href: "/projects" },
  { label: "Locations", href: "/locations" },
  { label: "People", href: "/people" },
  { label: "Contact", href: "/contact" },
  { label: "Partners", href: "/partners" },
  { label: "Gallery", href: "/gallery" },
  { label: "Lucky Seal", href: "/lucky-seal" },
];

const applyLink: SimpleLink = { label: "Apply", href: "/apply" };

const mobileNavItems: SimpleLink[] = [...navItems, applyLink];

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
      className={`bg-[#1a1e29]/90 backdrop-blur-md border-b border-white/[0.06] transition-shadow duration-300 ${
        scrolled || menuOpen ? "shadow-[0_8px_24px_rgb(0_0_0_/_0.3)]" : ""
      }`}
    >
      {/* Skip link: first focusable element, visually hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-white focus:text-[#0e0a14] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8">
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
            <span className="text-[#f1f3f9] font-bold text-xl tracking-widest hidden sm:block">
              SEAL
            </span>
          </Link>

          {/* Desktop nav — only shown once there's room for all items on one line.
              The header is position:fixed and every page's top padding is sized
              for a single-row header, so this must never wrap onto a 2nd row. */}
          <nav aria-label="Primary" className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`px-3 py-2 text-sm rounded-md transition-all duration-150 whitespace-nowrap ${
                  pathname === item.href
                    ? "text-[#f1f3f9] bg-[#8b7cf6]/[0.14] border border-[#8b7cf6]/30"
                    : "text-slate-400 border border-transparent hover:text-[#f1f3f9] hover:bg-white/[0.05]"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Apply — primary call to action, kept separate from the nav links */}
            <Link
              href={applyLink.href}
              aria-current={pathname === applyLink.href ? "page" : undefined}
              className="ml-2 px-4 py-2 text-sm font-semibold rounded-md border border-transparent text-white bg-[#5b2f86] hover:bg-[#4a2570] transition-all duration-150 whitespace-nowrap"
            >
              {applyLink.label}
            </Link>
          </nav>

          {/* Mobile: native <details> toggle — no JS required to open/close */}
          <details ref={detailsRef} className="xl:hidden mobile-nav-details">
            <summary className="mobile-nav-summary" aria-label="Toggle menu">
              {/* Hamburger lines — animated via CSS [open] selector */}
              <span className="mobile-nav-bar bar1" />
              <span className="mobile-nav-bar bar2" />
              <span className="mobile-nav-bar bar3" />
            </summary>

            {/* Dropdown — position:fixed so it escapes the header's flow */}
            <nav aria-label="Mobile" className="mobile-nav-dropdown">
              {mobileNavItems.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? "page" : undefined}
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
