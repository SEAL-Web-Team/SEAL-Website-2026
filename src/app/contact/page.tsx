"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import contact from "@/data/contact.json";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Message from ${name || "SEAL website"}`);
    const body = encodeURIComponent(
      `${message}\n\n—\n${name}\n${email}`
    );
    window.location.href = `mailto:${contact.form.recipient}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">{contact.page.title}</h1>
          <p className="page-subtitle">
            {contact.page.subtitle}{" "}
            <Link href="/people#leadership" className="text-slate-200 underline decoration-white/30 hover:decoration-white/70 transition-colors">
              View staff directory →
            </Link>
          </p>
        </div>

        <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">

          {/* Contact form */}
          <div className="surface-card overflow-hidden p-6 sm:p-9">
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-6">{contact.form.eyebrow}</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor={nameId} className="block text-sm font-medium text-slate-300 mb-2">
                  {contact.form.nameLabel}
                </label>
                <input
                  id={nameId}
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={contact.form.namePlaceholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label htmlFor={emailId} className="block text-sm font-medium text-slate-300 mb-2">
                  {contact.form.emailLabel}
                </label>
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={contact.form.emailPlaceholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-white/20"
                />
              </div>

              <div>
                <label htmlFor={messageId} className="block text-sm font-medium text-slate-300 mb-2">
                  {contact.form.messageLabel}
                </label>
                <textarea
                  id={messageId}
                  name="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={contact.form.messagePlaceholder}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 outline-none focus:border-white/20 resize-y"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                <button
                  type="submit"
                  className="action-chip justify-center sm:justify-start"
                >
                  <span>{contact.form.submitLabel}</span>
                  <span aria-hidden="true">→</span>
                </button>
                <p className="text-slate-500 text-xs leading-relaxed">{contact.form.helpText}</p>
              </div>
            </form>
          </div>

          {/* Address card */}
          <div className="surface-card overflow-hidden p-6 sm:p-9 h-full flex flex-col justify-center">
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">{contact.address.eyebrow}</p>
            <p className="text-white text-2xl font-semibold leading-tight">{contact.address.name}</p>
            <address className="not-italic text-slate-300 text-lg leading-relaxed mt-3">
              {contact.address.lines.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </address>
          </div>

        </div>
      </div>
    </div>
  );
}
