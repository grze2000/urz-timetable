type StepIllustrationProps = {
  step: 0 | 1 | 2;
};

export function StepIllustration({ step }: StepIllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 150"
      className="h-36 w-56 sm:h-44 sm:w-72"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="120" cy="75" r="70" fill="white" fillOpacity="0.14" />
      <circle cx="44" cy="42" r="7" fill="#FDB01C" />
      <circle cx="195" cy="112" r="5" fill="white" fillOpacity="0.7" />
      {step === 0 && (
        <>
          <rect x="66" y="28" width="108" height="95" rx="14" fill="white" />
          <path d="M66 56h108" stroke="#4D88FC" strokeWidth="4" />
          <path
            d="M92 20v18m56-18v18"
            stroke="#FDB01C"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <rect x="84" y="73" width="24" height="20" rx="5" fill="#DCE9FF" />
          <rect x="116" y="73" width="24" height="20" rx="5" fill="#DCE9FF" />
          <rect x="84" y="100" width="24" height="12" rx="5" fill="#DCE9FF" />
          <rect x="116" y="100" width="42" height="12" rx="5" fill="#FDB01C" />
        </>
      )}
      {step === 1 && (
        <>
          <path
            d="M58 66 120 33l62 33v9H58v-9Z"
            fill="white"
            stroke="white"
            strokeLinejoin="round"
          />
          <path
            d="M71 83v37m32-37v37m34-37v37m32-37v37"
            stroke="white"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="M53 127h134"
            stroke="#FDB01C"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <circle cx="120" cy="57" r="7" fill="#4D88FC" />
        </>
      )}
      {step === 2 && (
        <>
          <rect x="59" y="36" width="40" height="86" rx="7" fill="white" />
          <rect x="103" y="27" width="37" height="95" rx="7" fill="#DCE9FF" />
          <rect x="144" y="43" width="38" height="79" rx="7" fill="white" />
          <path
            d="M71 53h16m-16 11h16m44-19h18m-18 11h18m-41 17h26m22-12h15m-15 11h15"
            stroke="#4D88FC"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="121" cy="99" r="12" fill="#FDB01C" />
          <path
            d="m116 99 4 4 7-8"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
