export default function ContactPage() {
  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-20">
          <h1 className="text-5xl font-bold text-white">Contact</h1>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

          {/* Director card */}
          <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden flex">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-transparent z-10" />
            <div className="w-72 aspect-square shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://avatars.slack-edge.com/2016-09-13/79321426352_182972ad4e5224cc32ba_512.jpg"
                alt="Alexander Mamishev"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex flex-col gap-6 p-10">
              <div>
                <p className="text-sm uppercase tracking-widest text-purple-400 mb-3">Lab Director</p>
                <p className="text-white text-3xl font-semibold leading-tight">Alexander Mamishev</p>
                <p className="text-slate-300 text-lg mt-3">Department of Electrical &amp; Computer Engineering</p>
                <p className="text-slate-500 text-lg">University of Washington</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Email</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/director-email.svg" alt="Email address" className="h-8 w-auto" />
              </div>
            </div>
          </div>

          {/* Address card */}
          <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden p-10">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 to-transparent" />
            <p className="text-sm uppercase tracking-widest text-sky-400 mb-3">Mailing Address</p>
            <p className="text-white text-3xl font-semibold leading-tight">University of Washington</p>
            <address className="not-italic text-slate-300 text-lg leading-9 mt-3">
              185 Stevens Way<br />
              MS 352500<br />
              Department of ECE<br />
              Seattle, WA 98195
            </address>
          </div>

        </div>
      </div>
    </div>
  );
}
