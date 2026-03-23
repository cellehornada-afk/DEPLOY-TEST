import { useEffect, useState } from 'react';
import './StarsBackground.css';

const STAR_COUNT = 60;
const TWINKLE_DURATIONS = [2, 3, 4, 5, 6];
const FALLING_STAR_INTERVAL = 8000;
const FALLING_STAR_DURATION = 1500;

function Star({ left, top, size, delay, duration }) {
  return (
    <div
      className="star"
      style={{
        left,
        top,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

function FallingStar({ onComplete, left }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, FALLING_STAR_DURATION);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="falling-star" style={{ left: `${left}%` }}>
      <div className="falling-star-tail" />
      <div className="falling-star-head" />
    </div>
  );
}

export default function StarsBackground() {
  const [starData] = useState(() =>
    Array.from({ length: STAR_COUNT }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3,
      duration: TWINKLE_DURATIONS[Math.floor(Math.random() * TWINKLE_DURATIONS.length)],
    }))
  );
  const [fallingStar, setFallingStar] = useState(null);

  useEffect(() => {
    const showFallingStar = () => {
      setFallingStar(15 + Math.random() * 70);
    };

    const interval = setInterval(showFallingStar, FALLING_STAR_INTERVAL);
    setTimeout(showFallingStar, 500);

    return () => clearInterval(interval);
  }, []);

  const handleFallingStarComplete = () => setFallingStar(null);

  return (
    <div className="stars-background" aria-hidden="true">
      {starData.map((s, i) => (
        <Star key={i} {...s} />
      ))}
      {fallingStar !== null && (
        <FallingStar
          onComplete={handleFallingStarComplete}
          left={fallingStar}
        />
      )}
    </div>
  );
}
