"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { prefersReducedMotion } from "@/lib/motion";

/**
 * A three-dimensional rendering of the HybridRAG pipeline.
 *
 * Every node and edge corresponds to a real stage: documents are chunked, each
 * chunk is reachable by both dense and sparse retrieval, the two ranked lists
 * meet at reciprocal rank fusion, pass through the cross-encoder, and reach
 * generation, whose citations resolve back to the chunks they came from. The
 * travelling points are a query moving through those stages.
 *
 * Loaded lazily, and only on viewports wide enough to read it. Reduced motion
 * renders a single static frame instead of starting an animation loop.
 */

// Kept in sync with the colour tokens in globals.css. WebGL cannot read CSS
// custom properties, so the values are repeated here deliberately.
const COLOR_DENSE = 0x5b8cff;
const COLOR_SPARSE = 0x2db6a6;
const COLOR_CITATION = 0xf5a623;
const COLOR_NODE = 0x8a8f98;
const COLOR_CHUNK = 0x9aa2ad;

const CHUNK_COUNT = 6;
const CURVE_SEGMENTS = 16;

/**
 * Relative brightness per edge class. Structural edges sit back, the main
 * query path comes forward. Baked into vertex colour rather than per-material
 * opacity so every edge can live in one draw call.
 */
const WEIGHT = {
  ingest: 0.3,
  search: 0.62,
  spine: 1,
  citation: 0.55,
} as const;

/** Deterministic pseudo-random, so the layout is identical on every load. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function createRadialTexture(stops: Array<[number, string]>): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    for (const [offset, color] of stops) gradient.addColorStop(offset, color);
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  return new THREE.CanvasTexture(canvas);
}

/**
 * A dot with a solid core and a soft edge, for anything that has to read as a
 * discrete object. The halo gradient below is far too diffuse for this: points
 * drawn with it wash out into the background entirely.
 */
function createDotTexture(): THREE.CanvasTexture {
  return createRadialTexture([
    [0, "rgba(255,255,255,1)"],
    [0.42, "rgba(255,255,255,1)"],
    [0.68, "rgba(255,255,255,0.45)"],
    [1, "rgba(255,255,255,0)"],
  ]);
}

/** Soft radial sprite, used behind stage nodes as a halo. */
function createGlowTexture(): THREE.CanvasTexture {
  return createRadialTexture([
    [0, "rgba(255,255,255,0.95)"],
    [0.28, "rgba(255,255,255,0.35)"],
    [0.65, "rgba(255,255,255,0.08)"],
    [1, "rgba(255,255,255,0)"],
  ]);
}

interface Packet {
  curve: THREE.Curve<THREE.Vector3>;
  offset: number;
  speed: number;
  color: THREE.Color;
}

export function PipelineCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const random = createRandom(20240917);
    const reduced = prefersReducedMotion();
    const disposables: Array<{ dispose: () => void }> = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0.2, 0.7, 13.2);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      // No WebGL context available. The caller already renders a static
      // diagram underneath, so leaving the canvas out is the correct result.
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const glow = createGlowTexture();
    const dot = createDotTexture();
    disposables.push(glow, dot);

    const group = new THREE.Group();
    scene.add(group);

    // Stage positions, laid out left to right in pipeline order.
    // Index 0 is the top document, matching the ordering used by INGEST_LINKS.
    const docs = [1.35, 0, -1.35].map((y) => new THREE.Vector3(-6.5, y, 0));

    // Chunks sit on an evenly spaced column, index 0 at the top. Every one of
    // them is an endpoint of a document line and an origin of both retrieval
    // routes, so the cloud contains no unconnected points.
    const chunks: THREE.Vector3[] = Array.from({ length: CHUNK_COUNT }, (_, i) => {
      const t = i / (CHUNK_COUNT - 1);
      return new THREE.Vector3(-4.25, (0.5 - t) * 4.5, ((i % 3) - 1) * 0.32);
    });

    const dense = new THREE.Vector3(-1.5, 2.05, 0.2);
    const sparse = new THREE.Vector3(-1.5, -2.05, -0.2);
    const fusion = new THREE.Vector3(0.9, 0, 0);
    const rerank = new THREE.Vector3(3.1, 0, 0);
    const answer = new THREE.Vector3(5.5, 0, 0);

    /**
     * `zJitter` is zero for the structural edges on the left, so the document
     * crossings and the two retrieval fans stay clean lines between real
     * endpoints rather than wandering off their plane.
     */
    function curveBetween(
      a: THREE.Vector3,
      b: THREE.Vector3,
      bow = 0,
      zJitter = 0,
    ): THREE.Curve<THREE.Vector3> {
      const mid = a.clone().lerp(b, 0.5);
      mid.y += bow;
      if (zJitter !== 0) mid.z += (random() - 0.5) * zJitter;
      return new THREE.CatmullRomCurve3([a.clone(), mid, b.clone()]);
    }

    interface EdgeSpec {
      curve: THREE.Curve<THREE.Vector3>;
      color: number;
      weight: number;
      carriesPacket: boolean;
    }

    const edges: EdgeSpec[] = [];

    /**
     * Which document produced which chunk. Deliberately crossed: the top
     * document reaches down the column and the bottom one reaches up, because
     * a document's chunks are not a contiguous slice of the index. Every chunk
     * index appears exactly once, so no dot is left unconnected.
     */
    const INGEST_LINKS: ReadonlyArray<readonly [number, number]> = [
      [0, 4],
      [0, 5],
      [1, 1],
      [1, 3],
      [2, 0],
      [2, 2],
    ];

    INGEST_LINKS.forEach(([docIndex, chunkIndex], i) => {
      edges.push({
        curve: curveBetween(docs[docIndex], chunks[chunkIndex]),
        color: COLOR_CHUNK,
        weight: WEIGHT.ingest,
        carriesPacket: i % 3 === 0,
      });
    });

    // Both routes search every chunk, so both fans start from the same points
    // the document lines land on. Nothing originates from empty space.
    chunks.forEach((chunk, i) => {
      edges.push({
        curve: curveBetween(chunk, dense, 0.22),
        color: COLOR_DENSE,
        weight: WEIGHT.search,
        carriesPacket: i % 2 === 0,
      });
      edges.push({
        curve: curveBetween(chunk, sparse, -0.22),
        color: COLOR_SPARSE,
        weight: WEIGHT.search,
        carriesPacket: i % 2 === 1,
      });
    });

    edges.push({
      curve: curveBetween(dense, fusion, 0.4, 0.5),
      color: COLOR_DENSE,
      weight: WEIGHT.spine,
      carriesPacket: true,
    });
    edges.push({
      curve: curveBetween(sparse, fusion, -0.4, 0.5),
      color: COLOR_SPARSE,
      weight: WEIGHT.spine,
      carriesPacket: true,
    });
    edges.push({
      curve: curveBetween(fusion, rerank),
      color: COLOR_NODE,
      weight: WEIGHT.spine,
      carriesPacket: true,
    });
    edges.push({
      curve: curveBetween(rerank, answer),
      color: COLOR_NODE,
      weight: WEIGHT.spine,
      carriesPacket: true,
    });

    // Citations resolve from the answer back to the chunks they came from.
    // Shallower than before, so the return path reads as secondary rather
    // than sweeping across the whole lower half of the frame.
    for (let i = 0; i < 2; i += 1) {
      // Lands on real chunk dots, the same ones the retrieval fans start from.
      const cited = chunks[i === 0 ? 2 : 4];
      const control = new THREE.Vector3(1.2, -3.05 - i * 0.28, 1.1 + i * 0.35);
      const curve = new THREE.CatmullRomCurve3([answer.clone(), control, cited.clone()]);
      edges.push({
        curve,
        color: COLOR_CITATION,
        weight: WEIGHT.citation,
        carriesPacket: true,
      });
    }

    // One LineSegments holds every edge, with per-vertex colour.
    const edgePositions: number[] = [];
    const edgeColors: number[] = [];
    const boundsPoints: THREE.Vector3[] = [...docs, ...chunks];
    const scratch = new THREE.Color();

    for (const edge of edges) {
      const points = edge.curve.getPoints(CURVE_SEGMENTS);
      scratch.setHex(edge.color).multiplyScalar(edge.weight);
      for (let i = 0; i < points.length - 1; i += 1) {
        edgePositions.push(points[i].x, points[i].y, points[i].z);
        edgePositions.push(points[i + 1].x, points[i + 1].y, points[i + 1].z);
        edgeColors.push(scratch.r, scratch.g, scratch.b);
        edgeColors.push(scratch.r, scratch.g, scratch.b);
      }
      boundsPoints.push(...points);
    }

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    edgeGeometry.setAttribute("color", new THREE.Float32BufferAttribute(edgeColors, 3));
    const edgeMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    group.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));
    disposables.push(edgeGeometry, edgeMaterial);

    // Chunks as a soft point cloud. Sprited rather than square so they read as
    // individual pieces of text at this scale instead of pixel dust.
    const chunkGeometry = new THREE.BufferGeometry();
    chunkGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(chunks.flatMap((point) => [point.x, point.y, point.z]), 3),
    );
    const chunkMaterial = new THREE.PointsMaterial({
      color: COLOR_CHUNK,
      map: dot,
      size: 0.2,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
    });
    group.add(new THREE.Points(chunkGeometry, chunkMaterial));
    disposables.push(chunkGeometry, chunkMaterial);

    // Named stages as small spheres, each behind a soft halo so it reads as a
    // light source rather than a flat disc.
    const nodeGeometry = new THREE.SphereGeometry(0.15, 20, 20);
    disposables.push(nodeGeometry);

    const stages: Array<{ position: THREE.Vector3; color: number; scale: number }> = [
      ...docs.map((position) => ({ position, color: COLOR_NODE, scale: 0.8 })),
      { position: dense, color: COLOR_DENSE, scale: 1.35 },
      { position: sparse, color: COLOR_SPARSE, scale: 1.35 },
      { position: fusion, color: COLOR_NODE, scale: 1.45 },
      { position: rerank, color: COLOR_NODE, scale: 1.45 },
      { position: answer, color: COLOR_CITATION, scale: 1.75 },
    ];

    for (const stage of stages) {
      const material = new THREE.MeshBasicMaterial({ color: stage.color });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.copy(stage.position);
      mesh.scale.setScalar(stage.scale);
      group.add(mesh);
      disposables.push(material);

      const haloMaterial = new THREE.SpriteMaterial({
        map: glow,
        color: stage.color,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const halo = new THREE.Sprite(haloMaterial);
      halo.position.copy(stage.position);
      halo.scale.setScalar(stage.scale * 1.5);
      group.add(halo);
      disposables.push(haloMaterial);

      boundsPoints.push(stage.position);
    }

    // Travelling points: the query moving through the pipeline.
    const packets: Packet[] = edges
      .filter((edge) => edge.carriesPacket)
      .map((edge) => ({
        curve: edge.curve,
        offset: random(),
        speed: 0.1 + random() * 0.1,
        color: new THREE.Color(edge.color),
      }));

    const packetPositions = new Float32Array(packets.length * 3);
    const packetColors = new Float32Array(packets.length * 3);
    packets.forEach((packet, index) => {
      packetColors[index * 3] = packet.color.r;
      packetColors[index * 3 + 1] = packet.color.g;
      packetColors[index * 3 + 2] = packet.color.b;
    });

    const packetGeometry = new THREE.BufferGeometry();
    packetGeometry.setAttribute("position", new THREE.BufferAttribute(packetPositions, 3));
    packetGeometry.setAttribute("color", new THREE.BufferAttribute(packetColors, 3));
    const packetMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      map: dot,
      size: 0.3,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    group.add(new THREE.Points(packetGeometry, packetMaterial));
    disposables.push(packetGeometry, packetMaterial);

    const cursor = new THREE.Vector3();
    function placePackets(time: number) {
      packets.forEach((packet, index) => {
        const t = (packet.offset + time * packet.speed) % 1;
        packet.curve.getPointAt(t, cursor);
        packetPositions[index * 3] = cursor.x;
        packetPositions[index * 3 + 1] = cursor.y;
        packetPositions[index * 3 + 2] = cursor.z;
      });
      packetGeometry.attributes.position.needsUpdate = true;
    }

    // Centre the graph on the origin so rotation stays balanced, then frame it.
    // Measured from the geometry rather than from the object tree, so the
    // camera-facing halo sprites cannot inflate the bounds.
    const bounds = new THREE.Box3().setFromPoints(boundsPoints);
    const centre = bounds.getCenter(new THREE.Vector3());
    group.position.sub(centre);
    const extent = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);

    function resize() {
      const { clientWidth, clientHeight } = mount!;
      if (clientWidth === 0 || clientHeight === 0) return;

      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;

      // Pull the camera back just far enough that the graph fills the frame on
      // whichever axis is tighter, with headroom for the slow rotation.
      const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const forHeight = extent.y / halfFov;
      const forWidth = extent.x / (halfFov * camera.aspect);
      camera.position.set(0, 0.2, Math.max(forHeight, forWidth) * 1.06 + extent.z);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    let isVisible = true;
    const start = performance.now();

    function render(time: number) {
      placePackets(time);
      group.rotation.y = Math.sin(time * 0.1) * 0.17;
      group.rotation.x = Math.sin(time * 0.07) * 0.05;
      renderer.render(scene, camera);
    }

    if (reduced) {
      render(0.35);
    } else {
      const loop = () => {
        frame = requestAnimationFrame(loop);
        if (!isVisible || document.hidden) return;
        render((performance.now() - start) / 1000);
      };
      frame = requestAnimationFrame(loop);
    }

    // Stop drawing when the hero scrolls out of view.
    const visibility = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    visibility.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      for (const item of disposables) item.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden="true" />;
}

export default PipelineCanvas;
