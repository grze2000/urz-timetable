type ChoiceTileProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function ChoiceTile({ label, selected, onClick }: ChoiceTileProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl border-2 border-transparent px-4 py-4 text-left text-base font-semibold text-gray-800 shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        selected ? "bg-blue-100" : "bg-white"
      }`}
    >
      <span className="min-w-0 flex-1 break-words">{label}</span>
      <span
        aria-hidden="true"
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-primary bg-primary text-white"
            : "border-gray-300 bg-white"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
            <path
              d="m3 8 3 3 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
