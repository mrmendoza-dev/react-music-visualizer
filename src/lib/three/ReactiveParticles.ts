import type { GUI } from "dat.gui";
import gsap from "gsap";
import * as THREE from "three";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";

interface Dependencies {
  holder: THREE.Object3D;
  gui: GUI;
  audioManager: any; // Add proper type if available
  bpmManager: any; // Add proper type if available
}

export default class ReactiveParticles extends THREE.Object3D {
  private time: number;
  private properties: {
    startColor: number;
    endColor: number;
    size: number;
    autoMix: boolean;
    autoRotate: boolean;
    randomColor: boolean;
  };
  private material: THREE.ShaderMaterial | any;
  private geometry?: THREE.BufferGeometry;
  private pointsMesh: THREE.Object3D | any;
  private holderObjects: THREE.Object3D | any;
  private deps: Dependencies;

  constructor(dependencies: Dependencies) {
    super();
    this.name = "ReactiveParticles";
    this.time = 0;
    this.pointsMesh = null;
    this.deps = dependencies;
    this.material = null;
    this.geometry = undefined;
    this.holderObjects = null;
    this.properties = {
      startColor: 0xff00ff,
      endColor: 0x00ffff,
      size: 1,
      autoMix: false,
      autoRotate: false,
      randomColor: false,
    };
  }

  init() {
    this.deps.holder.add(this);

    this.holderObjects = new THREE.Object3D();
    this.add(this.holderObjects);

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        time: { value: 0 },
        offsetSize: { value: 2 },
        size: { value: this.properties.size },
        frequency: { value: 2 },
        amplitude: { value: 1 },
        offsetGain: { value: 0 },
        maxDistance: { value: 1.8 },
        startColor: { value: new THREE.Color(this.properties.startColor) },
        endColor: { value: new THREE.Color(this.properties.endColor) },
      },
    });

    this.addGUI();
    this.createCylinderMesh();
  }

  createBoxMesh() {
    // Keep original implementation
    let widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 40));
    let depthSeg = Math.floor(THREE.MathUtils.randInt(5, 80));
    this.geometry = new THREE.BoxGeometry(
      1,
      1,
      1,
      widthSeg,
      heightSeg,
      depthSeg
    );

    this.material.uniforms.offsetSize.value = Math.floor(
      THREE.MathUtils.randInt(30, 60)
    );
    this.material.needsUpdate = true;

    this.pointsMesh = new THREE.Object3D();
    this.pointsMesh.rotateX(Math.PI / 2);
    this.pointsMesh.scale.set(
      this.properties.size,
      this.properties.size,
      this.properties.size
    );
    this.holderObjects.add(this.pointsMesh);

    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);

    gsap.to(this.pointsMesh.rotation, {
      duration: 3,
      x: Math.random() * Math.PI,
      z: Math.random() * Math.PI * 2,
      ease: "none",
    });

    gsap.to(this.position, {
      duration: 0.6,
      z: THREE.MathUtils.randInt(9, 11),
      ease: "elastic.out(0.8)",
    });
  }

  createCylinderMesh() {
    // Keep original implementation
    let radialSeg = Math.floor(THREE.MathUtils.randInt(1, 3));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 5));
    this.geometry = new THREE.CylinderGeometry(
      1,
      1,
      4,
      64 * radialSeg,
      64 * heightSeg,
      true
    );

    this.material.uniforms.offsetSize.value = Math.floor(
      THREE.MathUtils.randInt(30, 60)
    );
    this.material.uniforms.size.value = 2;
    this.material.needsUpdate = true;
    this.material.uniforms.needsUpdate = true;

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.rotation.set(Math.PI / 2, 0, 0);
    this.pointsMesh.scale.set(
      this.properties.size,
      this.properties.size,
      this.properties.size
    );
    this.holderObjects.add(this.pointsMesh);

    let rotY = 0;
    let posZ = THREE.MathUtils.randInt(9, 11);

    if (Math.random() < 0.2) {
      rotY = Math.PI / 2;
      posZ = THREE.MathUtils.randInt(10, 11.5);
    }

    gsap.to(this.holderObjects.rotation, {
      duration: 0.2,
      y: rotY,
      ease: "elastic.out(0.2)",
    });

    gsap.to(this.position, {
      duration: 0.6,
      z: posZ,
      ease: "elastic.out(0.8)",
    });
  }

  createSphereMesh() {
    // Create sphere with random segments for variety
    let widthSeg = Math.floor(THREE.MathUtils.randInt(60, 120));
    let heightSeg = Math.floor(THREE.MathUtils.randInt(60, 120));
    this.geometry = new THREE.SphereGeometry(
      1, // radius
      widthSeg, // width segments
      heightSeg, // height segments
      0, // phiStart
      Math.PI * 2, // phiLength
      0, // thetaStart
      Math.PI // thetaLength
    );

    // Set particle size similar to box mesh
    this.material.uniforms.offsetSize.value = Math.floor(
      THREE.MathUtils.randInt(30, 60)
    );
    this.material.needsUpdate = true;

    // Create object hierarchy
    this.pointsMesh = new THREE.Object3D();
    this.pointsMesh.rotateX(Math.PI / 2);
    this.pointsMesh.scale.set(
      this.properties.size,
      this.properties.size,
      this.properties.size
    );
    this.holderObjects.add(this.pointsMesh);

    // Create and add points mesh
    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);

    // Add rotation animation
    gsap.to(this.pointsMesh.rotation, {
      duration: 3,
      x: Math.random() * Math.PI,
      z: Math.random() * Math.PI * 2,
      ease: "none",
    });

    // Add position animation
    gsap.to(this.position, {
      duration: 0.6,
      z: THREE.MathUtils.randInt(9, 11),
      ease: "elastic.out(0.8)",
    });
  }

  createTorusMesh() {
    const radius = 1;
    const tubeRadius = 0.4;
    const radialSegments = Math.floor(THREE.MathUtils.randInt(32, 64));
    const tubularSegments = Math.floor(THREE.MathUtils.randInt(192, 384));

    this.geometry = new THREE.TorusGeometry(
      radius,
      tubeRadius,
      radialSegments,
      tubularSegments
    );

    this.material.uniforms.offsetSize.value = Math.floor(
      THREE.MathUtils.randInt(20, 40)
    );
    this.material.needsUpdate = true;

    this.pointsMesh = new THREE.Object3D();
    this.pointsMesh.rotateX(Math.PI / 3);
    this.pointsMesh.scale.set(
      this.properties.size,
      this.properties.size,
      this.properties.size
    );
    this.holderObjects.add(this.pointsMesh);

    const pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.add(pointsMesh);

    // Add continuous rotation animation
    gsap.to(this.pointsMesh.rotation, {
      duration: 4,
      x: Math.PI * 2,
      z: Math.PI * 2,
      repeat: -1,
      ease: "none",
    });

    gsap.to(this.position, {
      duration: 0.8,
      z: THREE.MathUtils.randInt(9, 11),
      ease: "elastic.out(1, 0.75)",
    });
  }

  onBPMBeat() {
    const duration = this.deps.bpmManager.getBPMDuration() / 1000;

    if (this.deps.audioManager.isPlaying) {
      if (Math.random() < 0.3 && this.properties.autoRotate) {
        gsap.to(this.holderObjects.rotation, {
          duration: Math.random() < 0.8 ? 15 : duration,
          z: Math.random() * Math.PI,
          ease: "elastic.out(0.2)",
        });
      }

      if (Math.random() < 0.3) {
        this.resetMesh();
      }
    }
  }

  getRandomColor() {
    return Math.floor(Math.random() * 16777215);
  }

  resetMesh() {
    if (this.properties.autoMix) {
      this.destroyMesh();

      // Random number between 0 and 1
      const random = Math.random();

      // Split probability ranges for each mesh type
      if (random < 0.25) {
        this.createCylinderMesh();
      } else if (random < 0.5) {
        this.createBoxMesh();
      } else if (random < 0.75) {
        this.createSphereMesh();
      } else {
        this.createTorusMesh();
      }

      if (this.properties.randomColor) {
        // Generate new random colors
        const newStartColor = this.getRandomColor();
        const newEndColor = this.getRandomColor();

      // Animate color changes
      gsap.to(this.material.uniforms.startColor.value, {
        duration: this.deps.bpmManager
          ? (this.deps.bpmManager.getBPMDuration() / 1000) * 2
          : 2,
        r: ((newStartColor >> 16) & 255) / 255,
        g: ((newStartColor >> 8) & 255) / 255,
        b: (newStartColor & 255) / 255,
        ease: "expo.easeInOut",
      });

      gsap.to(this.material.uniforms.endColor.value, {
        duration: this.deps.bpmManager
          ? (this.deps.bpmManager.getBPMDuration() / 1000) * 2
          : 2,
        r: ((newEndColor >> 16) & 255) / 255,
        g: ((newEndColor >> 8) & 255) / 255,
        b: (newEndColor & 255) / 255,
          ease: "expo.easeInOut",
        });
      }

      // Animate frequency change
      gsap.to(this.material.uniforms.frequency, {
        duration: this.deps.bpmManager
          ? (this.deps.bpmManager.getBPMDuration() / 1000) * 2
          : 2,
        value: THREE.MathUtils.randFloat(0.5, 3),
        ease: "expo.easeInOut",
      });
    }
  }

  destroyMesh() {
    if (this.pointsMesh) {
      this.holderObjects.remove(this.pointsMesh);
      this.pointsMesh.geometry?.dispose();
      this.pointsMesh.material?.dispose();
      this.pointsMesh = null;
    }
  }

  update() {
    if (this.deps.audioManager?.isPlaying) {
      this.material.uniforms.amplitude.value =
        0.8 +
        THREE.MathUtils.mapLinear(
          this.deps.audioManager.frequencyData.high,
          0,
          0.6,
          -0.1,
          0.2
        );

      this.material.uniforms.offsetGain.value =
        this.deps.audioManager.frequencyData.mid * 0.6;

      const t = THREE.MathUtils.mapLinear(
        this.deps.audioManager.frequencyData.low,
        0.6,
        1,
        0.2,
        0.5
      );
      this.time += THREE.MathUtils.clamp(t, 0.2, 0.5);
    } else {
      this.material.uniforms.frequency.value = 0.8;
      this.material.uniforms.amplitude.value = 1;
      this.time += 0.2;
    }

    this.material.uniforms.time.value = this.time;
  }

  dispose() {
    this.destroyMesh();
    if (this.material) {
      this.material.dispose();
    }
    if (this.geometry) {
      this.geometry.dispose();
    }
    gsap.killTweensOf(this.holderObjects.rotation);
    gsap.killTweensOf(this.position);
    this.parent?.remove(this);
  }

  private addGUI() {
    const gui = this.deps.gui;
    const particlesFolder = gui.addFolder("PARTICLES");
    const visualizerFolder = gui.addFolder("VISUALIZER");

    particlesFolder
      .addColor(this.properties, "startColor")
      .listen()
      .name("Start Color")
      .onChange((e) => {
        this.material.uniforms.startColor.value = new THREE.Color(e);
      });

    particlesFolder
      .addColor(this.properties, "endColor")
      .listen()
      .name("End Color")
      .onChange((e) => {
        this.material.uniforms.endColor.value = new THREE.Color(e);
      });

    particlesFolder
      .add(this.material.uniforms.offsetSize, "value", 1, 100, 1)
      .name("Offset Size");
    particlesFolder
      .add(this.material.uniforms.frequency, "value", 0.1, 5, 0.1)
      .name("Frequency");
    particlesFolder
      .add(this.material.uniforms.amplitude, "value", 0.1, 3, 0.1)
      .name("Amplitude");
    particlesFolder
      .add(this.material.uniforms.offsetGain, "value", 0, 2, 0.1)
      .name("Offset Gain");
    particlesFolder
      .add(this.material.uniforms.maxDistance, "value", 0.1, 5, 0.1)
      .name("Max Distance");

    visualizerFolder.add(this.properties, "autoMix").listen().name("Auto Mix");
    visualizerFolder
      .add(this.properties, "autoRotate")
      .listen()
      .name("Auto Rotate");
    visualizerFolder
      .add(this.properties, "randomColor")
      .listen()
      .name("Random Color");

    visualizerFolder
      .add(
        {
          showBox: () => {
            this.destroyMesh();
            this.createBoxMesh();
            this.properties.autoMix = false;
          },
        },
        "showBox"
      )
      .name("Show Box");

    visualizerFolder
      .add(
        {
          showCylinder: () => {
            this.destroyMesh();
            this.createCylinderMesh();
            this.properties.autoMix = false;
          },
        },
        "showCylinder"
      )
      .name("Show Cylinder");

    visualizerFolder
      .add(
        {
          showSphere: () => {
            this.destroyMesh();
            this.createSphereMesh();
            this.properties.autoMix = false;
          },
        },
        "showSphere"
      )
      .name("Show Sphere");

    visualizerFolder
      .add(
        {
          showTorus: () => {
            this.destroyMesh();
            this.createTorusMesh();
            this.properties.autoMix = false;
          },
        },
        "showTorus"
      )
      .name("Show Torus");

    visualizerFolder
      .add(this.properties, "size", 0.1, 5, 0.1)
      .listen()
      .name("Size")
      .onChange((value) => {
        this.material.uniforms.size.value = value;
        if (this.pointsMesh) {
          this.pointsMesh.scale.set(value, value, value);
        }
      });

    particlesFolder.open();
    visualizerFolder.open();
  }
}
