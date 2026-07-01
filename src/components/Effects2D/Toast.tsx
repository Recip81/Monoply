import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useUiStore } from "@/stores/uiStore";

const KIND_STYLE: Record<string, string> = {
  info: "bg-white text-txt",
  success: "bg-c-green text-white",
  warn: "bg-accent text-white",
  error: "bg-c-red text-white",
};

export default function Toast() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastRow key={t.id} id={t.id} message={t.message} kind={t.kind} onDone={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastRow({
  id,
  message,
  kind,
  onDone,
}: {
  id: number;
  message: string;
  kind: string;
  onDone: (id: number) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDone(id), 2600);
    return () => clearTimeout(t);
  }, [id, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`px-4 py-2 rounded-2xl shadow-card text-sm font-body ${KIND_STYLE[kind] ?? KIND_STYLE.info}`}
    >
      {message}
    </motion.div>
  );
}
