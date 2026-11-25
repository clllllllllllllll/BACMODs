"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { OFFLINE_MESSAGE } from "@/hooks/use-online";

const ToastContext = createContext<{
  show: (message: string) => void;
  setDialog: Dispatch<SetStateAction<HTMLDialogElement | null>>;
}>({ show: () => {}, setDialog: () => {} });

/** Show a short message at the bottom of the screen. */
export function useToast() {
  return useContext(ToastContext).show;
}

export function useToastDialog() {
  return useContext(ToastContext).setDialog;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3500);
  }, []);

  useEffect(() => {
    const onOffline = () => show(OFFLINE_MESSAGE);
    const onOnline = () => setMessage((current) => current === OFFLINE_MESSAGE ? null : current);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    if (!navigator.onLine) onOffline();
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [show]);

  const context = useMemo(() => ({ show, setDialog }), [show]);
  // A native modal makes live regions outside it inert. Move the toast into the open sheet.
  const toast = (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none flex justify-center ${dialog ? "px-4" : "fixed inset-x-0 bottom-6 z-50 px-4"}`}
    >
      {message ? (
        <p className={`toast-in rounded-control bg-fg px-4 py-2.5 text-body-medium text-on-primary shadow-popover ${dialog ? "mb-4" : ""}`}>
          {message}
        </p>
      ) : null}
    </div>
  );

  return (
    <ToastContext.Provider value={context}>
      {children}
      {dialog ? createPortal(toast, dialog) : toast}
    </ToastContext.Provider>
  );
}
