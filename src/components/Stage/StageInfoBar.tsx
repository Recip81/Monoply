// 第三幕统一底部三信息区：「这是什么 · 玩家做了什么 · 发生了什么」。
// 各事件舞台复用，提升一致性与沉浸感。任意字段可省略。
export default function StageInfoBar({
  what,
  who,
  outcome,
  danger,
}: {
  what?: string;
  who?: string;
  outcome?: string;
  danger?: boolean;
}) {
  return (
    <div className="mt-5 -mx-7 -mb-7 px-5 py-3 rounded-b-3xl bg-bg/70 border-t border-black/5 grid grid-cols-3 gap-2 text-center">
      <InfoCol icon="📋" label="这是什么" text={what} />
      <InfoCol icon="🎮" label="玩家操作" text={who} />
      <InfoCol icon="⚡" label="结果" text={outcome} danger={danger} />
    </div>
  );
}

function InfoCol({
  icon,
  label,
  text,
  danger,
}: {
  icon: string;
  label: string;
  text?: string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] text-txt-3 mb-0.5">
        {icon} {label}
      </div>
      <div
        className={`text-xs leading-snug break-words ${
          danger ? "text-c-red font-bold" : "text-txt-2"
        }`}
      >
        {text || "—"}
      </div>
    </div>
  );
}
