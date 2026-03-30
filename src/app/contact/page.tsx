export default function ContactPage() {
  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-5xl font-bold text-white mb-16">Contact</h1>

        <div className="grid sm:grid-cols-2 gap-6">

          {/* Lab Director */}
          <div className="p-10 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm uppercase tracking-widest text-purple-400 mb-6">Lab Director</p>
            <p className="text-white text-2xl font-semibold mb-2">Alexander Mamishev</p>
            <p className="text-slate-300 text-lg mb-8">Department of Electrical &amp; Computer Engineering</p>
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">Email</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/director-email.svg" alt="Email address" className="h-6 w-auto" />
          </div>

          {/* Mailing Address */}
          <div className="p-10 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="text-sm uppercase tracking-widest text-purple-400 mb-6">Mailing Address</p>
            <address className="not-italic text-slate-200 text-lg leading-9">
              185 Stevens Way, MS 352500<br />
              Department of ECE<br />
              University of Washington<br />
              Seattle, WA 98195
            </address>
          </div>

        </div>
      </div>
    </div>
  );
}
