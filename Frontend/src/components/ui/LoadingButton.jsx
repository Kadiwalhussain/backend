const LoadingButton = ({ loading, children, className = "", ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-brand-ink transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <span className="inline-block size-4 animate-spin rounded-full border-2 border-brand-ink border-b-transparent" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default LoadingButton;
