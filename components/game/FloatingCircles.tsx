interface CircleConfig {
  top: string;
  left?: string;
  right?: string;
  delay: number;
  variant: string;
}

const circles: CircleConfig[] = [
  { top: "10%", left: "20%", delay: 0, variant: "purple" },
  { top: "30%", right: "25%", delay: 1000, variant: "purple" },
  // ... other circles
];

return (
  <div className="relative w-full h-full overflow-hidden">
    {circles.map((circle, index) => (
      <FloatingCircle
        key={index}
        className="absolute"
        style={{
          top: circle.top,
          ...(circle.left ? { left: circle.left } : {}),
          ...(circle.right ? { right: circle.right } : {})
        }}
        delay={circle.delay}
        variant={circle.variant}
      />
    ))}
  </div>
); 