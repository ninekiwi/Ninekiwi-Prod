type Props = {
  value: number;
  onChange: (n: number)=>void;
  ariaLabel?: string;
};

export default function StarRating({ value, onChange, ariaLabel }: Props){
  return (
    <div className="star-rating" role="radiogroup" aria-label={ariaLabel||'rating'}>
      <div className="star-row">
        {[1,2,3,4,5].map(n=>(
          <button key={n}
            className={`star ${n <= value ? 'active' : ''}`}
            data-star={n}
            onClick={()=>onChange(n)}
            aria-label={`${n} star`}
            role="radio"
            aria-checked={n===value}
          >
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.88L18.18 22 12 18.6 5.82 22 7 14.15l-5-4.88 6.91-1.01L12 2z"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
}
