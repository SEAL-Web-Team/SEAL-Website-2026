"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type SimpleLink = { label: string; href: string };

type NavGroup = {
  label: string;
  href?: string; // if present, the group label itself is a link
  children: SimpleLink[];
};

type NavItem =
  | ({ kind: "link" } & SimpleLink)
  | ({ kind: "group" } & NavGroup);

// Condensed to 5 primary items, with "Research" and "People" holding
// related pages in a dropdown. "Apply" is rendered separately as a CTA.
const navItems: NavItem[] = [
  { kind: "link", label: "Home", href: "/" },
  { kind: "link", label: "News & Awards", href: "/news" },
  {
    kind: "group",
    label: "Research",
    children: [
      { label: "Publications", href: "/publications" },
      { label: "Project Showcase", href: "/projects" },
    ],
  },
  { kind: "link", label: "Lab Locations", href: "/locations" },
  {
    kind: "group",
    label: "People",
    href: "/people",
    children: [
      { label: "Contact", href: "/contact" },
      { label: "Partner Organizations", href: "/partners" },
      { label: "Lucky Seal", href: "/lucky-seal" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
];

const applyLink: SimpleLink = { label: "Apply", href: "/apply" };

// Flat list for the mobile menu (keeps grouping via headings, since
// hover dropdowns don't make sense on touch devices).
const mobileSections: { heading: SimpleLink | { label: string }; links: SimpleLink[] }[] = [
  { heading: { label: "Home", href: "/" } as SimpleLink, links: [] },
  { heading: { label: "News & Awards", href: "/news" } as SimpleLink, links: [] },
  {
    heading: { label: "Research" },
    links: [
      { label: "Publications", href: "/publications" },
      { label: "Project Showcase", href: "/projects" },
    ],
  },
  { heading: { label: "Lab Locations", href: "/locations" } as SimpleLink, links: [] },
  {
    heading: { label: "People", href: "/people" } as SimpleLink,
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Partner Organizations", href: "/partners" },
      { label: "Lucky Seal", href: "/lucky-seal" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  { heading: { label: "Apply", href: "/apply" } as SimpleLink, links: [] },
];

function groupIsActive(group: NavGroup, pathname: string) {
  if (group.href === pathname) return true;
  return group.children.some((c) => c.href === pathname);
}

function NavDropdown({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = groupIsActive(group, pathname);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openNow = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const closeSoon = () => {
    clearCloseTimer();
    // small delay so moving the mouse from trigger to menu doesn't flicker-close
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => clearCloseTimer, []);

  const triggerClasses = `px-3 py-2 text-sm rounded-md transition-all duration-150 whitespace-nowrap flex items-center gap-1 ${
    active ? "text-white bg-white/[0.08]" : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
  }`;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false);
          (containerRef.current?.querySelector("a,button") as HTMLElement | null)?.focus();
        }
      }}
    >
      {group.href ? (
        <Link
          href={group.href}
          className={triggerClasses}
          aria-haspopup="true"
          aria-expanded={open}
        >
          {group.label}
          <span aria-hidden="true" className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </Link>
      ) : (
        <button
          type="button"
          className={triggerClasses}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {group.label}
          <span aria-hidden="true" className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
        </button>
      )}

      <div
        role="menu"
        aria-label={group.label}
        className={`absolute left-0 top-full pt-2 min-w-[13rem] transition-all duration-150 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="rounded-lg border border-white/10 bg-[#14101c]/97 backdrop-blur-md shadow-xl shadow-black/40 overflow-hidden py-1.5">
          {group.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              role="menuitem"
              className={`block px-4 py-2.5 text-sm transition-colors duration-100 ${
                pathname === child.href
                  ? "text-white bg-white/[0.08]"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      {/* Skip link: first focusable element, visually hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-white focus:text-[#0e0a14] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

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
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
            {navItems.map((item) =>
              item.kind === "link" ? (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`px-3 py-2 text-sm rounded-md transition-all duration-150 whitespace-nowrap ${
                    pathname === item.href
                      ? "text-white bg-white/[0.08]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <NavDropdown key={item.label} group={item} pathname={pathname} />
              )
            )}

            {/* Apply — primary call to action, kept separate from the 5 nav groups */}
            <Link
              href={applyLink.href}
              aria-current={pathname === applyLink.href ? "page" : undefined}
              className="ml-2 px-4 py-2 text-sm font-semibold rounded-md border border-white/20 text-white bg-white/10 hover:bg-white/20 transition-all duration-150 whitespace-nowrap"
            >
              {applyLink.label}
            </Link>
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
            <nav aria-label="Mobile" className="mobile-nav-dropdown">
              {mobileSections.map(({ heading, links }) => (
                <div key={heading.label} className={links.length ? "mobile-nav-group" : undefined}>
                  {"href" in heading && heading.href ? (
                    <Link
                      href={heading.href}
                      aria-current={pathname === heading.href ? "page" : undefined}
                      className={`mobile-nav-link ${pathname === heading.href ? "active" : ""}`}
                      onClick={() => {
                        if (detailsRef.current) detailsRef.current.open = false;
                      }}
                    >
                      {heading.label}
                    </Link>
                  ) : (
                    <p className="mobile-nav-heading">{heading.label}</p>
                  )}

                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={pathname === link.href ? "page" : undefined}
                      className={`mobile-nav-link mobile-nav-sublink ${pathname === link.href ? "active" : ""}`}
                      onClick={() => {
                        if (detailsRef.current) detailsRef.current.open = false;
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </details>

        </div>
      </div>
    </header>
  );
}
