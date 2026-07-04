import Link from "next/link";
import contactData from "@/data/contact.json";

const quickLinks = [
  { label: "News & Awards", href: "/news" },
  { label: "Project Showcase", href: "/projects" },
  { label: "Publications", href: "/publications" },
  { label: "People", href: "/people" },
  { label: "Partner Organizations", href: "/partners" },
  { label: "Gallery", href: "/gallery" },
  { label: "Apply", href: "/apply" },
];

export default function Footer() {
  const { address } = contactData;

  return (
    <footer className="border-t border-white/8 bg-black/20 backdrop-blur-[2px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-widest mb-3">
              SEAL
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sensors, Energy, and Automation Laboratory at the University of
              Washington. Solving problems in medicine, avionics, wearable tech,
              defense, energy, and sustainability.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-widest mb-3">
              Quick Links
            </h3>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-widest mb-3">
              Contact
            </h3>
            <address className="not-italic text-slate-400 text-sm leading-relaxed">
              <p className="font-medium text-slate-300">{address.name}</p>
              {address.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
            <Link
              href="/contact"
              className="inline-block mt-3 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Get in touch &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-4 px-4 text-center">
        <p className="text-slate-500 text-sm">
          &copy; 2026 SEAL. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
