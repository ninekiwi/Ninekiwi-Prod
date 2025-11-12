type Props = { percent: number };
export default function ProgressBar({ percent }: Props){
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Form Input</span>
        <span className="text-sm text-kiwi-green font-semibold" suppressHydrationWarning>
          {percent}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-kiwi-green h-2 rounded-full progress-bar" style={{width:`${percent}%`}} />
      </div>
    </div>
  );
}
