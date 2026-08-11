import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef } from "react";
import "./Galaxy.css";

type GalaxyProps = {
  density?: number;
  hueShift?: number;
  glowIntensity?: number;
  saturation?: number;
  speed?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  transparent?: boolean;
};

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0, 1); }
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform bool uTransparent;
varying vec2 vUv;
#define NUM_LAYER 4.0
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
float Hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }
float tris(float x) { float t = fract(x); return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0)); }
float trisn(float x) { float t = fract(x); return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0; }
vec3 hsv2rgb(vec3 c) { vec4 K = vec4(1.0, 0.666667, 0.333333, 3.0); vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); }
float Star(vec2 uv, float flare) { float d = length(uv); float m = (0.045 * uGlowIntensity) / max(d, 0.001); float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0)); m += rays * flare * uGlowIntensity; uv *= MAT45; rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0)); m += rays * 0.3 * flare * uGlowIntensity; return m * smoothstep(1.0, 0.18, d); }
vec3 StarLayer(vec2 uv) {
  vec3 col = vec3(0.0); vec2 gv = fract(uv) - 0.5; vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) { for (int x = -1; x <= 1; x++) {
    vec2 offset = vec2(float(x), float(y)); vec2 si = id + offset; float seed = Hash21(si); float size = fract(seed * 345.32); float flare = smoothstep(0.9, 1.0, size) * tri(uTime / (3.0 * seed + 1.0));
    float red = smoothstep(0.2, 1.0, Hash21(si + 1.0)) + 0.2; float blue = smoothstep(0.2, 1.0, Hash21(si + 3.0)) + 0.2; vec3 base = vec3(red, min(red, blue) * seed, blue);
    float hue = atan(base.g - base.r, base.b - base.r) / 6.283185 + 0.5; float sat = length(base - vec3(dot(base, vec3(0.299, 0.587, 0.114)))) * uSaturation; base = hsv2rgb(vec3(fract(hue + uHueShift / 360.0), sat, max(max(base.r, base.g), base.b)));
    vec2 drift = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5; float twinkle = mix(1.0, trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0, uTwinkleIntensity);
    col += Star(gv - offset - drift, flare) * size * base * twinkle;
  }} return col;
}
void main() {
  vec2 uv = (vUv * uResolution.xy - 0.5 * uResolution.xy) / uResolution.y;
  float a = uTime * uRotationSpeed; uv = mat2(cos(a), -sin(a), sin(a), cos(a)) * uv;
  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYER) { float depth = fract(i + uTime * 0.05); float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth); col += StarLayer(uv * scale + i * 453.32) * (depth * smoothstep(1.0, 0.9, depth)); }
  float alpha = smoothstep(0.0, 0.28, length(col)); gl_FragColor = uTransparent ? vec4(col, min(alpha, 1.0)) : vec4(col, 1.0);
}
`;

export default function Galaxy({ density = 1.05, hueShift = 224, glowIntensity = 0.55, saturation = 0.52, speed = 0.45, twinkleIntensity = 0.26, rotationSpeed = 0.025, transparent = true }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const renderer = new Renderer({ alpha: transparent, premultipliedAlpha: false, dpr: Math.min(window.devicePixelRatio, 1.5) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, transparent ? 0 : 1);
    if (transparent) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
    const program = new Program(gl, { vertex: vertexShader, fragment: fragmentShader, uniforms: {
      uTime: { value: 0 }, uResolution: { value: new Color(1, 1, 1) }, uDensity: { value: density }, uHueShift: { value: hueShift }, uSpeed: { value: speed }, uGlowIntensity: { value: glowIntensity }, uSaturation: { value: saturation }, uTwinkleIntensity: { value: twinkleIntensity }, uRotationSpeed: { value: rotationSpeed }, uTransparent: { value: transparent },
    }});
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const resize = () => { renderer.setSize(container.offsetWidth, container.offsetHeight); program.uniforms.uResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    container.appendChild(gl.canvas);
    let frame = 0;
    const render = (time: number) => { program.uniforms.uTime.value = time * 0.001; renderer.render({ scene: mesh }); frame = requestAnimationFrame(render); };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); gl.canvas.remove(); gl.getExtension("WEBGL_lose_context")?.loseContext(); };
  }, [density, glowIntensity, hueShift, rotationSpeed, saturation, speed, transparent, twinkleIntensity]);

  return <div aria-hidden="true" className="galaxy-container" ref={containerRef} />;
}
