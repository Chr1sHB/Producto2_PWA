import { Quiz } from './Quiz.js';
import { Game } from './Game.js';
import { API_URL } from './config.js';

document.addEventListener("DOMContentLoaded", async () => {
    
    const quizApp = new Quiz('quiz-interface', 'quiz-mode-badge');
    Game.init();

    // EJEMPLOS RECTA NUMÉRICA DINÁMICOS
    function generateRandomExamples() {
        const randPos = Math.floor(Math.random() * 9) + 1; 
        const randNeg = Math.floor(Math.random() * 9) + 1;

        const posEl = document.getElementById('dynamic-pos-example');
        const negEl = document.getElementById('dynamic-neg-example');

        const createMiniLine = (value, colorClass) => {
            const percent = ((value + 10) / 20) * 100;
            const sign = value > 0 ? "+" : "";
            
            let ticksHtml = '';
            for(let i = -10; i <= 10; i++) {
                const left = ((i + 10) / 20) * 100;
                const isMajor = i % 5 === 0;
                const height = isMajor ? 'h-3' : 'h-1.5';
                const color = isMajor ? 'bg-gray-400' : 'bg-gray-300';
                
                ticksHtml += `<div class="absolute top-0 ${height} ${color} w-px transform -translate-x-1/2" style="left: ${left}%;"></div>`;
            }

            let labelsHtml = '';
            [-10, -5, 0, 5, 10].forEach(num => {
                const left = ((num + 10) / 20) * 100;
                const text = num > 0 ? `+${num}` : `${num}`;
                labelsHtml += `<span class="absolute text-[9px] text-gray-500 -bottom-4 font-mono transform -translate-x-1/2" style="left: ${left}%;">${text}</span>`;
            });

            return `
                <div class="w-full pt-2 pb-5 px-1">
                    <p class="text-xs mb-2">
                        📝 Ejemplo: <strong>${sign}${value}</strong> está a ${Math.abs(value)} pasos del 0.
                    </p>
                    <div class="relative h-6 bg-gray-50 rounded w-full border border-gray-300 shadow-inner">
                        
                        <!-- Marcas de escala (Rayitas) -->
                        ${ticksHtml}
                        
                        <!-- Etiquetas numéricas (-10, -5, 0...) -->
                        ${labelsHtml}

                        <!-- El Indicador (Punto que se mueve) -->
                        <div class="absolute top-1/2 -translate-y-1/2 w-5 h-5 ${colorClass} text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-md transition-all duration-1000 z-10" 
                             style="left: ${percent}%; transform: translate(-50%, -50%);">
                            ${Math.abs(value)}
                        </div>
                    </div>
                </div>
            `;
        };

        if(posEl) {
            posEl.style.opacity = '0';
            setTimeout(() => {
                // Generar recta para positivo
                posEl.innerHTML = createMiniLine(randPos, "bg-green-500");
                posEl.className = "mt-2 p-3 bg-green-50 border border-green-200 rounded-lg transition-all duration-500";
                posEl.style.opacity = '1';
            }, 200);
        }

        if(negEl) {
            negEl.style.opacity = '0';
            setTimeout(() => {
                // Generar recta para negativo
                negEl.innerHTML = createMiniLine(-randNeg, "bg-red-500");
                negEl.className = "mt-2 p-3 bg-red-50 border border-red-200 rounded-lg transition-all duration-500";
                negEl.style.opacity = '1';
            }, 200);
        }
    }
    generateRandomExamples();

    const btnRefresh = document.getElementById('btn-refresh-examples');
    if(btnRefresh) {
        btnRefresh.addEventListener('click', generateRandomExamples);
    }

    // --- NAVEGACIÓN ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.view-section');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active-tab'));
            btn.classList.add('active-tab');
            sections.forEach(sec => sec.classList.add('hidden'));
            document.getElementById(btn.dataset.target + '-view').classList.remove('hidden');
        });
    });

    // --- CARGA VISTA SERVIDOR ---
    if (navigator.onLine) {
        try {
            const res = await fetch(`${API_URL}/api/daily-challenge-view`);
            if(res.ok) {
                const html = await res.text();
                document.getElementById('server-content').innerHTML = html;
            }
        } catch (e) {
            console.log("Offline o Backend no disponible.");
        }
    }

    // --- NOTIFICACIONES ---
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    }

    if ('serviceWorker' in navigator) {
        try {
            const register = await navigator.serviceWorker.register('./sw.js');
            if (navigator.onLine) register.update();

            const btnNotify = document.getElementById('btn-notify');
            
            btnNotify.addEventListener('click', async () => {
                if (!('Notification' in window)) return alert("No soportado");
                
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return alert("Permiso denegado");

                try {
                    const response = await fetch(`${API_URL}/api/vapid-public-key`);
                    const data = await response.json();
                    const convertedKey = urlBase64ToUint8Array(data.key);

                    const subscription = await register.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedKey
                    });

                    await fetch(`${API_URL}/api/subscribe`, {
                        method: 'POST',
                        body: JSON.stringify(subscription),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    alert("¡Conectado al servidor de notificaciones!");

                } catch (err) {
                    console.error("Error VAPID:", err);
                    alert("Error conectando con el servidor de notificaciones.");
                }
            });

        } catch (error) { console.error('Error SW:', error); }
    }

    if (window.appLoaded) window.appLoaded();
});