

import { useState, useRef, useEffect } from "react";
import { useThreeVisualizer } from "@/hooks/useThreeVisualizer";
import { Play, Pause, Settings } from "lucide-react";

export const MusicVisualizer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    initThree,
    createManagers,
    update,
    handleResize,
    isInitialized,
    isPlaying,
    toggle,
    play,
    pause,
  } = useThreeVisualizer();

  const [isSetup, setIsSetup] = useState(false);

  const handleStart = async () => {
    if (!containerRef.current || isSetup) return;

    // Initial setup
    initThree(containerRef.current);
    await createManagers();
    update();
    window.addEventListener("resize", handleResize);
    setIsSetup(true);

    // Start playing
    play();
  };

  const handleToggle = async () => {
    if (!isSetup) {
      await handleStart();
    } else {
      toggle();
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);


  return (
    <div className="relative w-screen h-screen">
      <div ref={containerRef} className="w-full h-full absolute top-0 left-0" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggle}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white ml-0.5" />
                )}
              </button>
              <div className="text-white/60 text-sm">
                {isPlaying ? "Playing" : "Stopped"}
              </div>
            </div>

            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-black/20 flex items-center justify-center transition-colors">
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};