import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import "./ElectricBorder.css";

export default function ElectricBorder({ children, color = "#59d9c5", borderRadius = 28, className = "" }: { children: ReactNode; color?: string; borderRadius?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let lastPaint = 0;
    let dimensions = { width: 1, height: 1, dpr: 1 };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      dimensions = { width: rect.width, height: rect.height, dpr };
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const noise = (x: number, y: number, time: number) => Math.sin(x * 3.7 + time) * Math.cos(y * 3.1 - time * 0.7) * 0.5 + Math.sin(x * 7.3 - y * 4.1 + time * 1.4) * 0.5;
    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      if (document.hidden || time - lastPaint < 33) return;
      lastPaint = time;
      const { width, height, dpr } = dimensions;
      const padding = 10;
      const radius = Math.min(borderRadius, width / 2, height / 2);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.beginPath();
      const perimeter = 2 * (width + height) - 8 * radius + Math.PI * 2 * radius;
      const points = Math.min(155, Math.max(84, Math.floor(perimeter / 8)));
      for (let index = 0; index <= points; index += 1) {
        const progress = index / points;
        const distance = progress * perimeter;
        let x = padding;
        let y = padding;
        const straightW = width - padding * 2 - radius * 2;
        const straightH = height - padding * 2 - radius * 2;
        const arc = (Math.PI * radius) / 2;
        if (distance < straightW) { x += radius + distance; }
        else if (distance < straightW + arc) { const angle = -Math.PI / 2 + (distance - straightW) / arc * Math.PI / 2; x = width - padding - radius + Math.cos(angle) * radius; y = padding + radius + Math.sin(angle) * radius; }
        else if (distance < straightW + arc + straightH) { x = width - padding; y = padding + radius + (distance - straightW - arc); }
        else if (distance < straightW + arc * 2 + straightH) { const angle = (distance - straightW - arc - straightH) / arc * Math.PI / 2; x = width - padding - radius + Math.cos(angle) * radius; y = height - padding - radius + Math.sin(angle) * radius; }
        else if (distance < straightW * 2 + arc * 2 + straightH) { x = width - padding - radius - (distance - straightW - arc * 2 - straightH); y = height - padding; }
        else if (distance < straightW * 2 + arc * 3 + straightH) { const angle = Math.PI / 2 + (distance - straightW * 2 - arc * 2 - straightH) / arc * Math.PI / 2; x = padding + radius + Math.cos(angle) * radius; y = height - padding - radius + Math.sin(angle) * radius; }
        else if (distance < straightW * 2 + arc * 3 + straightH * 2) { x = padding; y = height - padding - radius - (distance - straightW * 2 - arc * 3 - straightH); }
        else { const angle = Math.PI + (distance - straightW * 2 - arc * 3 - straightH * 2) / arc * Math.PI / 2; x = padding + radius + Math.cos(angle) * radius; y = padding + radius + Math.sin(angle) * radius; }
        const wobble = noise(progress * 8, progress * 13, time * 0.0012) * 1.5;
        if (index === 0) context.moveTo(x + wobble, y - wobble); else context.lineTo(x + wobble, y - wobble);
      }
      context.closePath();
      context.strokeStyle = color;
      context.globalAlpha = 0.8;
      context.lineWidth = 1;
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.stroke();
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    };
    frame = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [borderRadius, color]);

  return <div ref={containerRef} className={`electric-border ${className}`} style={{ "--electric": color, borderRadius: `${borderRadius}px` } as CSSProperties}><canvas aria-hidden="true" ref={canvasRef} className="electric-border__canvas" /><div className="electric-border__content">{children}</div></div>;
}
