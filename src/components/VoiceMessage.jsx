import { useEffect, useRef, useState } from "react";
import { HiPlay, HiPause } from "react-icons/hi2";

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VoiceMessage({ audioUrl, durationSec, isMine }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const progress = durationSec > 0 ? Math.min(1, currentTime / durationSec) : 0;

  return (
    <div className="flex items-center gap-2.5 min-w-[180px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full transition-colors ${
          isMine ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
        }`}
      >
        {playing ? <HiPause className="text-sm" /> : <HiPlay className="text-sm -mr-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div
          className={`h-1.5 rounded-full overflow-hidden ${
            isMine ? "bg-white/20" : "bg-primary/15"
          }`}
        >
          <div
            className={`h-full rounded-full ${isMine ? "bg-white" : "bg-primary"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className={`text-[11px] ${isMine ? "text-white/80" : "text-muted"}`}>
          {formatDuration(playing || currentTime > 0 ? currentTime : durationSec)}
        </span>
      </div>
    </div>
  );
}
