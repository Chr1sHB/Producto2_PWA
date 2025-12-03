import { Quiz } from './Quiz.js';
import { Game } from './Game.js';
import { API_URL } from './config.js'; // Importamos la configuración

document.addEventListener("DOMContentLoaded", async () => {
    
    const quizApp = new Quiz('quiz-interface', 'quiz-mode-badge');
    Game.init();

    // Navegación
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

    // Cargar Vista Servidor (Usando URL Externa)
    if (navigator.onLine) {
        try {
            const res = await fetch(`${API_URL}/api/daily-challenge-view`);
            if(res.ok) {
                const html = await res.text();
                document.getElementById('server-content').innerHTML = html;
            }
        } catch (e) {
            console.log("No se pudo conectar al backend para el reto diario.");
        }
    }

    // Lógica Push VAPID (Usando URL Externa)
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
            // Usamos './' para GitHub Pages
            const register = await navigator.serviceWorker.register('./sw.js');
            if (navigator.onLine) register.update();

            const btnNotify = document.getElementById('btn-notify');
            
            btnNotify.addEventListener('click', async () => {
                if (!('Notification' in window)) return alert("No soportado");
                
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return alert("Permiso denegado");

                try {
                    // Pedir clave pública al backend externo
                    const response = await fetch(`${API_URL}/api/vapid-public-key`);
                    const data = await response.json();
                    const convertedKey = urlBase64ToUint8Array(data.key);

                    const subscription = await register.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedKey
                    });

                    // Enviar suscripción al backend externo
                    await fetch(`${API_URL}/api/subscribe`, {
                        method: 'POST',
                        body: JSON.stringify(subscription),
                        headers: { 'Content-Type': 'application/json' }
                    });

                    alert("¡Conectado al servidor de notificaciones!");

                } catch (err) {
                    console.error("Error VAPID:", err);
                    alert("Error conectando con el servidor de notificaciones (¿Está encendido?)");
                }
            });

        } catch (error) { console.error('Error SW:', error); }
    }

    if (window.appLoaded) window.appLoaded();
});