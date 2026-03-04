import { motion } from "framer-motion";

const MotionSection = motion.section;

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <MotionSection
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-lg"
      >
        <div className="rounded-3xl border border-white/20 bg-white/10 p-7 shadow-soft backdrop-blur-xl sm:p-9">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-200/90">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </MotionSection>
    </main>
  );
};

export default AuthLayout;
