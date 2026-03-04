import PageTransition from "../animations/PageTransition";

const AppShell = ({ title, description }) => {
  return (
    <PageTransition>
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-8 shadow-soft">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-300">{description}</p>
        </div>
      </main>
    </PageTransition>
  );
};

export default AppShell;
