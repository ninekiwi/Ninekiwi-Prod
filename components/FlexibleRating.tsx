"use client";
import { useEffect, useState } from "react";
import StarRating from "./StarRating";

type Mode = 'stars' | 'yesno';
type Props = {
  label: string;
  id: string;
  value: string;         // "1..5" or "Yes/No"
  mode: Mode;
  onChange: (mode: Mode, value: string)=>void;
};

export default function FlexibleRating({ label, id, value, mode, onChange }: Props){
  const [stars, setStars] = useState<number>(Number(value)||0);
  const [yn, setYN] = useState<string>(['Yes','No'].includes(value)? value : '');

  useEffect(()=>{ // reflect external
    if (mode==='stars') setStars(Number(value)||0);
    else setYN(['Yes','No'].includes(value)? value : '');
  }, [mode, value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm mb-1">{label}</label>
      <div className="star-rating" data-mode={mode}>
        {/* toggle */}
        <div className="flex gap-4 text-xs text-kiwi-gray mb-1">
          <label className="flex items-center gap-1">
            <input type="radio" name={`mode_${id}`} value="stars"
              checked={mode==='stars'}
              onChange={()=>onChange('stars', '')}/>
            ⭐ Rate
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name={`mode_${id}`} value="yesno"
              checked={mode==='yesno'}
              onChange={()=>onChange('yesno', '')}/>
            Yes/No
          </label>
        </div>

        {/* stars */}
        {mode==='stars' && (
          <StarRating
            value={stars}
            onChange={(n)=>{ setStars(n); onChange('stars', String(n)); }}
            ariaLabel={label}
          />
        )}

        {/* yes/no */}
        {mode==='yesno' && (
          <div className="yesno">
            {['Yes','No'].map(v=>(
              <label key={v} className="flex items-center gap-1">
                <input type="radio" name={`${id}_yesno`} value={v}
                  checked={yn===v}
                  onChange={(e)=>{ setYN(e.target.value); onChange('yesno', e.target.value); }} />
                {v}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
