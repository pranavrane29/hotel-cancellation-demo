import { motion, useReducedMotion } from "framer-motion";
import { type CSSProperties, type ElementType, type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";

export function PillNav({ items }: { items: { label: string; href: string }[] }) {
  return <nav aria-label="Primary" className="cardia-pill-nav"><div className="cardia-pill-brand"><span className="cardia-pill-brand-dot" />CARDIA</div><div className="cardia-pill-links">{items.map(item => <a key={item.href} href={item.href} className="cardia-pill-link"><span>{item.label}</span></a>)}</div></nav>;
}

export function LineSidebar({ items }: { items: { label: string; href: string }[] }) {
  return <nav aria-label="Section shortcuts" className="cardia-line-sidebar">{items.map((item, index) => <a key={item.href} href={item.href}><span>{String(index + 1).padStart(2, "0")}</span>{item.label}</a>)}</nav>;
}

export function ClickSpark({ children, color = "#b9fff3" }: { children: ReactNode; color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<{ x: number; y: number; angle: number; start: number }[]>([]);
  const animation = useRef<number>(0);
  useEffect(() => () => cancelAnimationFrame(animation.current), []);
  const burst = (event: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio, 1.5);
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    const context = canvas.getContext("2d"); if (!context) return;
    const x = (event.clientX - rect.left) * dpr; const y = (event.clientY - rect.top) * dpr;
    const now = performance.now(); particles.current = Array.from({ length: 7 }, (_, index) => ({ x, y, angle: (Math.PI * 2 * index) / 7, start: now }));
    const draw = (time: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(particle => {
        const progress = Math.min(1, (time - particle.start) / 440); if (progress >= 1) return false;
        const distance = progress * 28 * dpr; const length = (1 - progress) * 10 * dpr;
        context.globalAlpha = 1 - progress; context.strokeStyle = color; context.lineWidth = 1.6 * dpr;
        context.beginPath(); context.moveTo(particle.x + Math.cos(particle.angle) * distance, particle.y + Math.sin(particle.angle) * distance); context.lineTo(particle.x + Math.cos(particle.angle) * (distance + length), particle.y + Math.sin(particle.angle) * (distance + length)); context.stroke();
        return true;
      });
      if (particles.current.length) animation.current = requestAnimationFrame(draw); else context.globalAlpha = 1;
    };
    cancelAnimationFrame(animation.current); animation.current = requestAnimationFrame(draw);
  };
  return <div className="click-spark" onClick={burst}><canvas aria-hidden="true" ref={canvasRef} /><div className="click-spark-content">{children}</div></div>;
}

export function SpecularButton({ children, onClick, disabled = false, type = "button", className = "" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const reduce = useReducedMotion();
  const handleMove = (event: MouseEvent<HTMLButtonElement>) => { const rect = event.currentTarget.getBoundingClientRect(); setPosition({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 }); };
  return <button type={type} disabled={disabled} onClick={onClick} onPointerMove={reduce ? undefined : handleMove} className={`specular-action ${reduce ? "reduced-motion" : ""} ${className}`} style={{ "--shine-x": `${position.x}%`, "--shine-y": `${position.y}%` } as CSSProperties}><span>{children}</span></button>;
}

export function StarBorder({ children, as: Component = "div", className = "" }: { children: ReactNode; as?: ElementType; className?: string }) {
  return <Component className={`star-border ${className}`}><span className="star-border-ray star-border-ray-top" /><span className="star-border-ray star-border-ray-bottom" /><span className="star-border-content">{children}</span></Component>;
}

export function MaskedHeading({ text, className = "" }: { text: string; className?: string }) {
  const [visible, setVisible] = useState(false); const ref = useRef<HTMLHeadingElement>(null); const reduce = useReducedMotion();
  useEffect(() => { const element = ref.current; if (!element || reduce) { setVisible(true); return; } const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { threshold: 0.2 }); observer.observe(element); return () => observer.disconnect(); }, [reduce]);
  return <h1 ref={ref} data-text={text} className={`masked-heading ${visible ? "is-visible" : ""} ${className}`}>{text}</h1>;
}

export function GradualBlur({ position = "bottom" }: { position?: "top" | "bottom" }) { return <div aria-hidden="true" className={`gradual-blur gradual-blur-${position}`} />; }

export function AnimatedList({ items }: { items: { eyebrow: string; title: string; copy: string; icon: ReactNode }[] }) {
  const [selected, setSelected] = useState(0); const reduce = useReducedMotion();
  return <div className="animated-list" role="list">{items.map((item, index) => <motion.button key={item.title} type="button" role="listitem" className={selected === index ? "is-selected" : ""} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => setSelected(index)} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={reduce ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.28, delay: index * 0.06 }}><span className="animated-list-icon">{item.icon}</span><span><small>{item.eyebrow}</small><strong>{item.title}</strong><em>{item.copy}</em></span></motion.button>)}</div>;
}

export function ScrollVelocity({ text }: { text: string }) { return <div aria-hidden="true" className="velocity-ribbon"><div>{Array.from({ length: 6 }, (_, index) => <span key={index}>{text}<i>✦</i></span>)}</div></div>; }
