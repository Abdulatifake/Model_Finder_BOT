import { useEffect } from 'react';

export default function Toast({ text, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return <div className="toast">{text}</div>;
}
