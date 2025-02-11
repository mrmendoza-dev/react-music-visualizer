import { useEffect, useRef, useState } from "react";
import * as dat from "dat.gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import AudioManager, { Song } from "@/lib/managers/AudioManager.ts";
import BPMManager from "@/lib/managers/BPMManager.ts";
import ReactiveParticles from "@/lib/three/ReactiveParticles.ts";

export const useThreeVisualizer = () => {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const holderRef = useRef<THREE.Object3D | null>(null);
  const particlesRef = useRef<ReactiveParticles | null>(null);
  const guiRef = useRef<dat.GUI | null>(null);
  const audioManagerRef = useRef<AudioManager | any>(null);
  const bpmManagerRef = useRef<BPMManager | any>(null);
  const animationFrameRef = useRef<number>();
  const controlsRef = useRef<OrbitControls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [audio, setAudio] = useState<THREE.Audio | any>(null);

  const initThree = (container: HTMLDivElement) => {
    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    camera.position.z = 12;
    camera.frustumCulled = false;
    cameraRef.current = camera;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.add(camera);
    sceneRef.current = scene;

    // Initialize holder
    const holder: any = new THREE.Object3D();
    holder.name = "holder";
    scene.add(holder);
    holder.sortObjects = false;
    holderRef.current = holder;

    // Initialize GUI
    guiRef.current = new dat.GUI({ autoPlace: true });
    guiRef.current.domElement.style.display = "none";

    // Initialize OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.enablePan = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    // Add event listeners for right-click rotation
    renderer.domElement.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent default right-click menu
    });

   }




  const createManagers = async () => {
    // Initialize Audio Manager
    audioManagerRef.current = new AudioManager();
    console.log(audioManagerRef.current);
    await audioManagerRef.current.loadAudioBuffer();

    // Initialize BPM Manager
    bpmManagerRef.current = new BPMManager();
    bpmManagerRef.current.addEventListener("beat", () => {
      particlesRef.current?.onBPMBeat();
    });
    await bpmManagerRef.current.detectBPM(audioManagerRef.current.audio.buffer);

    // Initialize particles
    particlesRef.current = new ReactiveParticles({
      holder: holderRef.current!,
      gui: guiRef.current!,
      audioManager: audioManagerRef.current!,
      bpmManager: bpmManagerRef.current!,
    });
    particlesRef.current.init();
  };

  const update = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Update OrbitControls
    if (controlsRef.current) {
      controlsRef.current.update();
    }

    // Always update particles to maintain visual state
    particlesRef.current?.update();

    // Only update audio manager when playing
    if (isPlaying) {
      audioManagerRef.current?.update();
    }

    // Always render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    animationFrameRef.current = requestAnimationFrame(update);
  };

  const handleResize = () => {
    if (!rendererRef.current || !cameraRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  const play = () => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.play();
    setCurrentSong(audioManagerRef.current.currentSong);
    setAudio(audioManagerRef.current.audio);
    setIsPlaying(true);
  };

  const pause = () => {
    if (!audioManagerRef.current) return;
    audioManagerRef.current.pause();
    setIsPlaying(false);
  };

  const getCurrentTime = () => {
    if (!audioManagerRef.current?.audio) return 0;
    const audio = audioManagerRef.current.audio;
    return (
      audio.context.currentTime - (audio._startedAt || 0) + (audio.offset || 0)
    );
  };

  const toggle = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleGui = () => {
    if (guiRef.current) {
      guiRef.current.domElement.style.display =
        guiRef.current.domElement.style.display === "none" ? "block" : "none";
    }
  };

  // Add method to toggle auto-rotation
  const toggleAutoRotate = () => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      guiRef.current?.destroy();
      rendererRef.current?.dispose();
      audioManagerRef.current?.stop();
    };
  }, []);

  return {
    initThree,
    createManagers,
    update,
    handleResize,
    isPlaying,
    play,
    pause,
    toggle,
    currentSong,
    audio,
    getCurrentTime,
    toggleGui,
    toggleAutoRotate, // Added new method
  };
};
