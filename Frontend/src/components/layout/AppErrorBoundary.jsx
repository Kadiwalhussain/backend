import React from "react";

import { logClientEvent } from "../../services/log.service";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logClientEvent({
      level: "error",
      category: "ui-crash",
      message: error?.message || "Unhandled UI crash",
      meta: {
        stack: error?.stack || "",
        componentStack: errorInfo?.componentStack || "",
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-red-900/20 p-6 text-center">
            <h1 className="text-xl font-semibold text-red-100">Unexpected UI Error</h1>
            <p className="mt-2 text-sm text-red-200">Please refresh the app. The issue was logged.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl border border-red-300/50 px-4 py-2 text-sm font-semibold text-red-100"
            >
              Reload App
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
