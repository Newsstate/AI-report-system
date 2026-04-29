import { Zap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col justify-between p-12 bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/10 blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AI SEO Platform</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Automate your SEO reporting with AI
            </h1>
            <p className="mt-4 text-lg text-white/60 leading-relaxed">
              Connect n8n workflows, analyze data with GPT-4, and deliver stunning reports to your clients automatically.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Trigger n8n automation workflows instantly',
              'AI-powered report generation with GPT-4',
              'Beautiful client reports in minutes',
              'Full agency team management',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-sm text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/30">
          © {new Date().getFullYear()} AI SEO Platform. All rights reserved.
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
