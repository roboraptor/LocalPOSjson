// components/Modal.js
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const closeOnEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEsc);
    return () => document.removeEventListener('keydown', closeOnEsc);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        {title && <div className="modalTitle">{title}</div>}
        <div className="modalBody">{children}</div>
        <div className="modalActions">
          <button className="btn btn-ghost" onClick={onClose}>Zavřít</button>
        </div>
      </div>
    </div>
  );
}
