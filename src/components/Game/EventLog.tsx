import { useEffect, useRef } from "react";
import { useUiStore } from "@/stores/uiStore";

// 实时游戏记录：滚动展示最近事件
export default function EventLog() {
  const log = useUiStore((s) => s.eventLog);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length]);

  return (
    <div className="flex-1 min-h-0 bg-surface rounded-2xl shadow-card p-3 flex flex-col">
      <div className="font-title text-sm text-txt-2 mb-2 shrink-0">📜 游戏记录</div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs text-txt-2">
        {log.length === 0 && (
          <div className="text-txt-3 text-center py-4">暂无记录</div>
        )}
        {log.map((item) => (
          <div key={item.id} className="leading-snug">
            <span className="text-txt-3">·</span> {item.message}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
