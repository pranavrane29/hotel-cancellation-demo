import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";
import "./Galaxy.css";

type GalaxyProps = {
  focal?: readonly [number, number];
  rotation?: readonly [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  mouseRepulsion?: boolean;
  glowIntensity?: number;
  saturation?: number;
  repulsionStrength?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  autoCenterRepulsion?: number;
  transparent?: boolean;
};

const DEFAULT_FOCAL: readonly [number, number] = [0.5, 0.5];
const DEFAULT_ROTATION: readonly [number, number] = [1, 0];

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;
varying vec2 vUv;

#define NUM_LAYER 3.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }
float tris(float x) { float t = fract(x); return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0)); }
float trisn(float x) { float t = fract(x); return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0; }
vec3 hsv2rgb(vec3 c) { vec4 K = vec4(1.0, 0.666667, 0.333333, 3.0); vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); }
float Star(vec2 uv, float flare) { float d = length(uv); float m = (0.05 * uGlowIntensity) / max(d, 0.001); float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0)); m += rays * flare * uGlowIntensity; uv *= MAT45; rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0)); m += rays * 0.3 * flare * uGlowIntensity; return m * smoothstep(1.0, 0.2, d); }
vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0); vec2 gv = fract(uv) - 0.5; vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) { for (int x = -1; x <= 1; x++) {
    vec2 offset = vec2(float(x), float(y)); vec2 si = id + offset; float seed = Hash21(si); float size = fract(seed * 345.32); float flareSize = smoothstep(0.9, 1.0, size) * tri(uStarSpeed / (PERIOD * seed + 1.0));
    float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF; float blue = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF; vec3 base = vec3(red, min(red, blue) * seed, blue);
    float hue = fract(atan(base.g - base.r, base.b - base.r) / 6.283185 + 0.5 + uHueShift / 360.0); float saturation = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation; base = hsv2rgb(vec3(hue, saturation, max(max(base.r, base.g), base.b)));
    vec2 drift = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5; float twinkle = mix(1.0, trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0, uTwinkleIntensity);
    col += Star(gv - offset - drift, flareSize) * size * base * twinkle;
  }} return col;
}
void main() {
  vec2 focalPx = uFocal * uResolution.xy; vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  vec2 mouseNorm = uMouse - vec2(0.5);
  if (uAutoCenterRepulsion > 0.0) { float centerDist = length(uv); uv += normalize(uv) * (uAutoCenterRepulsion / (centerDist + 0.1)) * 0.05; }
  else if (uMouseRepulsion) { vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y; float mouseDist = length(uv - mousePosUV); uv += normalize(uv - mousePosUV) * (uRepulsionStrength / (mouseDist + 0.1)) * 0.05 * uMouseActiveFactor; }
  else { uv += mouseNorm * 0.1 * uMouseActiveFactor; }
  float autoRotAngle = uTime * uRotationSpeed; uv = mat2(cos(autoRotAngle), -sin(autoRotAngle), sin(autoRotAngle), cos(autoRotAngle)) * uv; uv = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x) * uv;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) { float depth = fract(i + uStarSpeed * uSpeed); float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth); col += StarLayer(uv * scale + i * 453.32) * (depth * smoothstep(1.0, 0.9, depth)); }
  float alpha = min(smoothstep(0.0, 0.3, length(col)), 1.0); gl_FragColor = uTransparent ? vec4(col, alpha) : vec4(col, 1.0);
}
`;

export default function Galaxy({ focal = DEFAULT_FOCAL, rotation = DEFAULT_ROTATION, starSpeed = 0.5, density = 0.84, hueShift = 224, disableAnimation = false, speed = 0.42, mouseInteraction = true, mouseRepulsion = true, glowIntensity = 0.5, saturation = 0.52, repulsionStrength = 1.35, twinkleIntensity = 0.22, rotationSpeed = 0.022, autoCenterRepulsion = 0, transparent = true }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0);
  const smoothMouseActive = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const constrainedDevice = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    const pixelRatio = Math.min(window.devicePixelRatio, constrainedDevice ? 0.75 : 1);
    const renderer = new Renderer({ alpha: transparent, premultipliedAlpha: false, dpr: pixelRatio });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, transparent ? 0 : 1);
    if (transparent) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }

    const program = new Program(gl, { vertex: vertexShader, fragment: fragmentShader, uniforms: {
      uTime: { value: 0 }, uResolution: { value: new Color(1, 1, 1) }, uFocal: { value: new Float32Array(focal) }, uRotation: { value: new Float32Array(rotation) }, uStarSpeed: { value: starSpeed }, uDensity: { value: density }, uHueShift: { value: hueShift }, uSpeed: { value: speed }, uMouse: { value: new Float32Array([0.5, 0.5]) }, uGlowIntensity: { value: glowIntensity }, uSaturation: { value: saturation }, uMouseRepulsion: { value: mouseRepulsion }, uTwinkleIntensity: { value: twinkleIntensity }, uRotationSpeed: { value: rotationSpeed }, uRepulsionStrength: { value: repulsionStrength }, uMouseActiveFactor: { value: 0 }, uAutoCenterRepulsion: { value: autoCenterRepulsion }, uTransparent: { value: transparent },
    }});
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const resize = () => { renderer.setSize(container.offsetWidth, container.offsetHeight); program.uniforms.uResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize(); container.appendChild(gl.canvas);

    const updatePointer = (event: MouseEvent) => { const rect = container.getBoundingClientRect(); targetMousePos.current = { x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), y: Math.min(1, Math.max(0, 1 - (event.clientY - rect.top) / rect.height)) }; targetMouseActive.current = 1; };
    const resetPointer = () => { targetMouseActive.current = 0; };
    const handleWindowLeave = (event: MouseEvent) => { if (!event.relatedTarget) resetPointer(); };
    const interactive = mouseInteraction && !constrainedDevice;
    if (interactive) { window.addEventListener("mousemove", updatePointer, { passive: true }); window.addEventListener("mouseout", handleWindowLeave); }

    const frameInterval = 1000 / (constrainedDevice ? 28 : 45);
    let animationFrame = 0; let lastRendered = 0;
    const render = (time: number) => {
      animationFrame = requestAnimationFrame(render);
      if (document.hidden || time - lastRendered < frameInterval) return;
      lastRendered = time;
      if (!disableAnimation) { program.uniforms.uTime.value = time * 0.001; program.uniforms.uStarSpeed.value = (time * 0.001 * starSpeed) / 10; }
      smoothMousePos.current.x += (targetMousePos.current.x - smoothMousePos.current.x) * 0.075; smoothMousePos.current.y += (targetMousePos.current.y - smoothMousePos.current.y) * 0.075; smoothMouseActive.current += (targetMouseActive.current - smoothMouseActive.current) * 0.075;
      program.uniforms.uMouse.value[0] = smoothMousePos.current.x; program.uniforms.uMouse.value[1] = smoothMousePos.current.y; program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;
      renderer.render({ scene: mesh });
    };
    animationFrame = requestAnimationFrame(render);

    return () => { cancelAnimationFrame(animationFrame); observer.disconnect(); if (interactive) { window.removeEventListener("mousemove", updatePointer); window.removeEventListener("mouseout", handleWindowLeave); } gl.canvas.remove(); gl.getExtension("WEBGL_lose_context")?.loseContext(); };
  }, [autoCenterRepulsion, density, disableAnimation, focal, glowIntensity, hueShift, mouseInteraction, mouseRepulsion, repulsionStrength, rotation, rotationSpeed, saturation, speed, starSpeed, transparent, twinkleIntensity]);

  return <div aria-hidden="true" className="galaxy-container" ref={containerRef} />;
}
