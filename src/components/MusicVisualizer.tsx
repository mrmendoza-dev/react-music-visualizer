import { useState, useRef, useEffect } from "react";
import { useThreeVisualizer } from "@/hooks/useThreeVisualizer";
import { Play, Pause, Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};


export const MusicVisualizer = () => {
 const containerRef = useRef<HTMLDivElement>(null);
 const setupPromiseRef = useRef<Promise<void> | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [isSetup, setIsSetup] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [isDragging, setIsDragging] = useState(false);
  const [isGuiVisible, setIsGuiVisible] = useState(false);

  const {
    initThree,
    createManagers,
    update,
    handleResize,
    isPlaying,
    toggle,
    play,
    currentSong,
    audio,
    getCurrentTime,
    toggleGui,
    isInitialized,
  } = useThreeVisualizer();

useEffect(() => {
  let animationFrame: number;

  const updateTime = () => {
    if (audio && !isDragging && isPlaying) {
      // Added isPlaying check here
      const current =
        audio.context.currentTime -
        (audio._startedAt || 0) +
        (audio.offset || 0);
      setCurrentTime(current);
      setDuration(audio.buffer.duration);
    }
    animationFrame = requestAnimationFrame(updateTime);
  };

  if (isPlaying || audio) {
    updateTime();
  }

  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
}, [isPlaying, audio, isDragging]);

  const handleSliderChange = (value: number[]) => {
    if (!audio) return;
    const newTime = value[0];
    setCurrentTime(newTime);

    // Only seek if we have audio
    if (audio) {
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        audio.pause();
      }
      audio.offset = newTime;
      if (wasPlaying) {
        audio.play();
      }
    }
  };

  const handleStart = async () => {
    // Guard against multiple simultaneous setup attempts
    if (
      !containerRef.current ||
      isSetup ||
      isLoading ||
      setupPromiseRef.current
    ) {
      return;
    }

    setIsLoading(true);

    try {
      // Create a new setup promise and store it
      setupPromiseRef.current = (async () => {
        // Initial setup
        initThree(containerRef.current!);
        await createManagers();
        update();
        window.addEventListener("resize", handleResize);
        setIsSetup(true);

        // Start playing
        play();
      })();

      // Wait for setup to complete
      await setupPromiseRef.current;
    } catch (error) {
      console.error("Failed to start visualizer:", error);
      // Optionally add error state handling here
    } finally {
      setIsLoading(false);
      setupPromiseRef.current = null;
    }
  };

  const handleToggle = async () => {
    // Prevent spam clicking during setup or loading
    if (isLoading) return;

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

    const handleSettingsClick = () => {
      setIsGuiVisible(!isGuiVisible);
      toggleGui();
    };

      useEffect(() => {
        // Hide GUI on mount
        const guiElement = document.querySelector(".dg.ac") as HTMLElement;
        if (guiElement) {
          guiElement.style.display = "none";
        }
      }, []);


  return (
    <div className="relative w-screen h-screen">
      <div ref={containerRef} className="w-full h-full absolute top-0 left-0" />

      {!isInitialized && (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`size-20 rounded-full flex items-center justify-center transition-colors border-2 border-indigo-500/70 bg-indigo-500/20 ${
              isLoading
                ? "bg-white/5 cursor-not-allowed"
                : "bg-white/10 hover:bg-indigo-500/30"
            }`}
          >
            {isLoading ? (
              <div className="size-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            ) : (
              <Play className="size-10 text-white ml-0.5" />
            )}
          </button>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/10 backdrop-blur-md z-50">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="space-y-3">

            <div className="px-2 pt-1">
              <Slider
                disabled={!isInitialized}
                defaultValue={[0]}
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSliderChange}
                onValueCommit={() => setIsDragging(false)}
                onPointerDown={() => setIsDragging(true)}
                className="w-full cursor-pointer"
              />
            </div>
            {/* )} */}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleToggle}
                  disabled={isLoading}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isLoading
                      ? "bg-white/5 cursor-not-allowed"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </button>
                <div className="flex flex-col">
                  <div className="text-white/60 text-sm">
                    <span>
                      {" "}
                      {isLoading ? "Initializing..." : currentSong?.title}
                    </span>
                  </div>
                  {isSetup && (
                    <div className="text-white/40 text-xs">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSettingsClick}
                disabled={!isSetup || isLoading}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  !isSetup || isLoading
                    ? "bg-white/5 cursor-not-allowed"
                    : isGuiVisible
                    ? "bg-white/20 hover:bg-white/30"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <Settings
                  className={`w-5 h-5 ${
                    !isSetup || isLoading
                      ? "text-white/40"
                      : isGuiVisible
                      ? "text-white"
                      : "text-white/80"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicVisualizer;
