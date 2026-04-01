export default function ContactPage() {
  return (
    <div className="page-shell">
      <div className="page-container">

        <div className="page-header">
          <h1 className="page-title">Contact</h1>
          <p className="page-subtitle">Reach out to the lab director or send mail to our campus address.</p>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

          {/* Director card */}
          <div className="surface-card overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-72 aspect-square shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://avatars.slack-edge.com/2016-09-13/79321426352_182972ad4e5224cc32ba_512.jpg"
                alt="Alexander Mamishev"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex flex-col gap-6 p-7 w-full">
              <div>
                <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">Lab Director</p>
                <p className="text-white text-3xl font-semibold leading-tight">Alexander Mamishev</p>
                <p className="text-slate-300 text-lg mt-3">
                  University of Washington Department of Electrical &amp; Computer Engineering
                </p>
              </div>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/director-email.svg" alt="Email address" className="h-8 w-auto" />
              </div>
            </div>
          </div>

          {/* Address card */}
          <div className="surface-card overflow-hidden p-7">
            <p className="text-sm uppercase tracking-widest text-slate-500 mb-3">Mailing Address</p>
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
