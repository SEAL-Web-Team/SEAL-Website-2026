export default function ApplyPage() {
  return (
    <div className="page-shell">
      <div className="page-container-tight">

        <div className="page-header">
          <h1 className="page-title">Apply to SEAL</h1>
          <p className="page-subtitle">
            Applications are open. Review the resources below before submitting.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <a
            href="https://tinyurl.com/SEALFAQs"
            target="_blank"
            rel="noopener noreferrer"
            className="surface-card surface-card-hover group flex items-start justify-between gap-6 p-7"
          >
            <div>
              <p className="text-white font-semibold text-lg mb-1">FAQ & Open Positions</p>
              <p className="text-slate-300 text-base leading-relaxed">What SEAL is, how it works, and what positions are available.</p>
            </div>
            <span className="action-chip shrink-0 mt-1 text-xs">
              <span>Open</span>
              <span aria-hidden="true">→</span>
            </span>
          </a>

          <a
            href="https://docs.google.com/presentation/d/e/2PACX-1vQ9VG87uMQSPhwdXctTRM0jIenB3S-NXUVoAy4HSrdVnFQN6p9np0MDO316I6s93w/pub?start=false&loop=false&delayms=3000"
            target="_blank"
            rel="noopener noreferrer"
            className="surface-card surface-card-hover group flex items-start justify-between gap-6 p-7"
          >
            <div>
              <p className="text-white font-semibold text-lg mb-1">Cover Letter Template</p>
              <p className="text-slate-300 text-base leading-relaxed">Required format for your cover letter submission.</p>
            </div>
            <span className="action-chip shrink-0 mt-1 text-xs">
              <span>Open</span>
              <span aria-hidden="true">→</span>
            </span>
          </a>

          <a
            href="https://goo.gl/forms/aiTE4Vms9RejcAg13"
            target="_blank"
            rel="noopener noreferrer"
            className="surface-card surface-card-hover group flex items-start justify-between gap-6 p-7"
          >
            <div>
              <p className="text-white font-semibold text-lg mb-1">Apply Now</p>
              <p className="text-slate-300 text-base leading-relaxed">Submit your application once you have reviewed the FAQ and prepared your cover letter.</p>
            </div>
            <span className="action-chip shrink-0 mt-1 text-xs">
              <span>Open</span>
              <span aria-hidden="true">→</span>
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}
