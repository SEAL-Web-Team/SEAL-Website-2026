export default function ApplyPage() {
  return (
    <div className="min-h-screen pt-40 pb-28 px-8">
      <div className="max-w-3xl mx-auto">

        <div className="mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Apply to SEAL</h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Applications are open. Review the resources below before submitting.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <a
            href="https://tinyurl.com/SEALFAQs"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group flex items-start justify-between gap-6 p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-400 to-transparent" />
            <div>
              <p className="text-xs uppercase tracking-widest text-purple-400 mb-2">Read first</p>
              <p className="text-white font-semibold text-lg mb-1">FAQ & Open Positions</p>
              <p className="text-slate-400 text-base leading-relaxed">What SEAL is, how it works, and what positions are available.</p>
            </div>
            <p className="text-purple-400 text-sm font-semibold shrink-0 mt-1 group-hover:text-purple-300 transition-colors">Open →</p>
          </a>

          <a
            href="https://docs.google.com/presentation/d/e/2PACX-1vQ9VG87uMQSPhwdXctTRM0jIenB3S-NXUVoAy4HSrdVnFQN6p9np0MDO316I6s93w/pub?start=false&loop=false&delayms=3000"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group flex items-start justify-between gap-6 p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sky-400 to-transparent" />
            <div>
              <p className="text-xs uppercase tracking-widest text-sky-400 mb-2">Template</p>
              <p className="text-white font-semibold text-lg mb-1">Cover Letter Template</p>
              <p className="text-slate-400 text-base leading-relaxed">Required format for your cover letter submission.</p>
            </div>
            <p className="text-sky-400 text-sm font-semibold shrink-0 mt-1 group-hover:text-sky-300 transition-colors">Open →</p>
          </a>

          <a
            href="https://goo.gl/forms/aiTE4Vms9RejcAg13"
            target="_blank"
            rel="noopener noreferrer"
            className="relative group flex items-start justify-between gap-6 p-7 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 to-transparent" />
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-400 mb-2">Application</p>
              <p className="text-white font-semibold text-lg mb-1">Apply Now</p>
              <p className="text-slate-400 text-base leading-relaxed">Submit your application once you have reviewed the FAQ and prepared your cover letter.</p>
            </div>
            <p className="text-emerald-400 text-sm font-semibold shrink-0 mt-1 group-hover:text-emerald-300 transition-colors">Open →</p>
          </a>
        </div>

      </div>
    </div>
  );
}
