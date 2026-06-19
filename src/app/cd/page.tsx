// c:\projects\LocalPOSjson\src\app\cd\page.tsx
'use client';

import { useState, useEffect } from 'react';
import * as Fa from 'react-icons/fa6';
import { QRCodeSVG } from 'qrcode.react';
import { Item } from '@/types/db';

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' });

interface CustomerState {
  receipt: Item[];
  activeTab: any;
  showQRModal: boolean;
  spaydString: string;
  externalQrUrl: string | null;
  status: 'pending' | 'completed';
}

export default function CustomerDisplayPage() {
  const [state, setState] = useState<CustomerState>({
    receipt: [],
    activeTab: null,
    showQRModal: false,
    spaydString: '',
    externalQrUrl: null,
    status: 'pending',
  });

  const [shopName, setShopName] = useState<string>('EffortUp');
  const [floatingIcons, setFloatingIcons] = useState<any[]>([]);

  // Generování plovoucích ikon na pozadí
  useEffect(() => {
    const iconsList = [
      Fa.FaUtensils,
      Fa.FaBeerMugEmpty,
      Fa.FaBurger,
      Fa.FaPizzaSlice,
      Fa.FaCookie,
      Fa.FaWineGlass,
      Fa.FaGlassWater,
      Fa.FaIceCream,
    ];

    const generated = Array.from({ length: 18 }).map((_, idx) => {
      const IconComponent = iconsList[Math.floor(Math.random() * iconsList.length)];
      return {
        id: idx,
        IconComponent,
        left: `${Math.random() * 90 + 5}%`,
        top: `${Math.random() * 90 + 5}%`,
        size: `${Math.random() * 1.5 + 1.2}rem`,
        duration: `${Math.random() * 20 + 20}s`, // Pomalé plynutí (20s - 40s)
        delay: `${Math.random() * -40}s`, // Spuštění v náhodném čase animace
        opacity: Math.random() * 0.58 + 0.24, // Velmi jemná viditelnost na pozadí
      };
    });
    setFloatingIcons(generated);
  }, []);

  // Načtení nastavení obchodu při startu pro zobrazení názvu
  useEffect(() => {
    const fetchGeneral = async () => {
      try {
        const res = await fetch('/api/general');
        if (res.ok) {
          const data = await res.json();
          if (data.organization_name) {
            setShopName(data.organization_name);
          }
        }
      } catch (err) {
        console.error('Nepodařilo se načíst název obchodu:', err);
      }
    };
    fetchGeneral();
  }, []);

  // SSE Stream připojení s automatickým reconnectem
  useEffect(() => {
    let eventSource: EventSource;

    function connect() {
      console.log('[SSE Client] Connecting to /api/customer-display/stream...');
      eventSource = new EventSource('/api/customer-display/stream');

      eventSource.onopen = () => {
        console.log('[SSE Client] Connection opened successfully!');
      };

      eventSource.onmessage = (event) => {
        try {
          console.log('[SSE Client] Received state update:', event.data);
          const data = JSON.parse(event.data);
          setState(data);
        } catch (err) {
          console.error('[SSE Client] Chyba při parsování SSE zprávy:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[SSE Client] SSE spojení ztraceno. Zkouším se znovu připojit za 2 sekundy...', err);
        eventSource.close();
        setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const receipt = state?.receipt || [];
  const total = receipt.reduce((sum, item) => sum + (item?.price || 0), 0);
  const hasItems = receipt.length > 0;

  // 1. Děkovná obrazovka po úspěšném zaplacení
  if (state.status === 'completed') {
    return (
      <div className="success-screen">
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        <div className="success-icon">
          <Fa.FaCircleCheck />
        </div>
        <h1 className="success-title">Děkujeme za nákup!</h1>
        <p className="success-subtitle">Přejeme Vám hezký den.</p>
      </div>
    );
  }

  return (
    <div className="display-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {!hasItems ? (
        // 2. Welcome obrazovka (prázdný košík)
        <div className="welcome-screen">
          {floatingIcons.map((item) => {
            const Icon = item.IconComponent;
            return (
              <div
                key={item.id}
                className="floating-icon"
                style={{
                  left: item.left,
                  top: item.top,
                  fontSize: item.size,
                  '--float-duration': item.duration,
                  '--float-delay': item.delay,
                  '--float-opacity': item.opacity,
                } as React.CSSProperties}
              >
                <Icon />
              </div>
            );
          })}
          <div className="welcome-content">
            <div className="welcome-icon">
              <Fa.FaUtensils />
            </div>
            <h1 className="welcome-title">{shopName}</h1>
            <p className="welcome-subtitle">Vítejte! Objednejte si prosím u pokladny.</p>
          </div>
        </div>
      ) : (
        // 3. Aktivní nákup - zobrazení pouze účtenky vystředěné na obrazovce
        <div className="receipt-container">
          <div className="receipt">
            <h3 className="receipt__title">
              Účtenka {state.activeTab && `(${state.activeTab.is_table ? 'Stůl' : 'Účet'}: ${state.activeTab.name})`}
            </h3>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {receipt.filter(Boolean).map((item, idx) => (
                <div key={`${item.id || idx}-${idx}`} className="receipt__row">
                  <span className="receipt__name">{item.name || 'Položka'}</span>
                  <span className="receipt__price">{czk.format(item.price || 0)}</span>
                </div>
              ))}
            </div>

            <div className="receipt__total">
              <span>Celkem</span>
              <span>{czk.format(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. QR Platba Modal */}
      {state.showQRModal && state.spaydString && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>QR Platba</h2>
            <div className="qr-container">
              {state.externalQrUrl ? (
                <img src={state.externalQrUrl} alt="QR Platba" width={256} height={256} />
              ) : (
                <QRCodeSVG value={state.spaydString} size={256} />
              )}
            </div>
            <div className="qr-amount">{czk.format(total)}</div>
            <p className="qr-instruction">Naskenujte QR kód ve své bankovní aplikaci.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Premium CSS styly pro klientský displej
const styles = `
.display-container {
  display: flex;
  width: 100vw;
  height: calc(100vh - var(--header-h, 0px));
  background-color: #000;
  overflow: hidden;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

.welcome-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, #18181b 0%, #09090b 100%);
  position: relative;
}

.welcome-screen::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

.welcome-content {
  text-align: center;
  z-index: 1;
  animation: fadeIn 1s ease-out;
}

.welcome-icon {
  font-size: 5rem;
  color: var(--success);
  margin-bottom: 2rem;
  animation: pulse-slow 3s infinite ease-in-out;
}

.welcome-title {
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(to right, #fff, var(--muted));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
}

.welcome-subtitle {
  font-size: 1.5rem;
  color: var(--muted);
}

.receipt-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, #18181b 0%, #09090b 100%);
  padding: var(--sp-6);
  animation: fadeIn 0.4s ease-out;
}

.receipt-container .receipt {
  width: 100%;
  max-width: 500px;
  height: 90%;
  max-height: 800px;
  animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-card {
  background: #18181b;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 3rem;
  width: 90%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
}

.qr-container {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  display: inline-block;
}

.qr-amount {
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 0.5rem;
}

.qr-instruction {
  font-size: 1.15rem;
  color: var(--muted);
  margin-bottom: 0;
}

.success-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at center, #022c22 0%, #020617 100%);
  color: #fff;
  z-index: 2000;
  animation: fadeIn 0.5s ease-out;
}

.success-icon {
  font-size: 6rem;
  color: #10b981;
  margin-bottom: 2rem;
  animation: scaleBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.success-title {
  font-size: 3rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 1rem;
  text-align: center;
}

.success-subtitle {
  font-size: 1.3rem;
  color: #a7f3d0;
  text-align: center;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes scaleUp {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse-slow {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
}

@keyframes scaleBounce {
  0% { transform: scale(0); }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.floating-icon {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  animation: float-around var(--float-duration) infinite linear;
  animation-delay: var(--float-delay);
  opacity: var(--float-opacity);
  color: var(--success);
}

@keyframes float-around {
  0% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -40px) rotate(90deg);
  }
  50% {
    transform: translate(60px, 0px) rotate(180deg);
  }
  75% {
    transform: translate(30px, 40px) rotate(270deg);
  }
  100% {
    transform: translate(0, 0) rotate(360deg);
  }
}
`;
