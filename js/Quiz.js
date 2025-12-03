import { StorageManager } from './Storage.js';
import { API_URL } from './config.js';

// --- PREGUNTAS DE RESPALDO ---
// Estas se usan si no hay internet Y no hay datos guardados.
const FALLBACK_QUESTIONS = [
    { 
        id: 'default-1', 
        text: "¿Qué número es mayor: -2 o +4?", 
        options: ["-2", "+4"], 
        correct: "+4", 
        explanation: "En la recta numérica, +4 está a la derecha del -2." 
    },
    { 
        id: 'default-2', 
        text: "Elige el signo correcto: +2 ___ -5", 
        options: ["> (Mayor que)", "< (Menor que)"], 
        correct: "> (Mayor que)", 
        explanation: "Cualquier número positivo es mayor que uno negativo." 
    },
    { 
        id: 'default-3', 
        text: "Ordena de menor a mayor: -3, 0, +1", 
        options: ["-3, 0, +1", "0, -3, +1"], 
        correct: "-3, 0, +1", 
        explanation: "-3 es el más negativo (izquierda), luego el 0, luego +1." 
    },
    { 
        id: 'default-4', 
        text: "¿El número 0 es positivo o negativo?", 
        options: ["Es positivo", "Es neutro"], 
        correct: "Es neutro", 
        explanation: "El 0 es el punto de origen y no tiene signo." 
    },
    { 
        id: 'default-5', 
        text: "Si estás en el piso -1 y subes 2 pisos, ¿a cuál llegas?", 
        options: ["Piso +1", "Piso +2"], 
        correct: "Piso +1", 
        explanation: "Desde -1, subes a 0, y luego a +1." 
    }
];

export class Quiz {
    constructor(containerId, statusBadgeId) {
        this.container = document.getElementById(containerId);
        this.badge = document.getElementById(statusBadgeId);
        this.storage = new StorageManager();
        this.questions = [];
        this.renderStartScreen();
    }

    async load() {
        this.setLoading(true);
        this.questions = [];

        try {
            // Intentar Servidor
            console.log("Intentando conectar a:", API_URL);
            const res = await fetch(`${API_URL}/api/questions`);
            
            if (!res.ok) throw new Error('Error Servidor');
            
            this.questions = await res.json();
            
            // Si funciona, guardamos en caché
            await this.storage.saveQuestions(this.questions);
            this.updateBadge('Online (Servidor)', 'bg-green-100 text-green-800');

        } catch (serverError) {
            console.warn('Fallo Servidor, intentando caché...', serverError);
            
            // Intentar Caché (IndexedDB)
            try {
                const cachedData = await this.storage.getQuestions();
                
                if (cachedData && cachedData.length > 0) {
                    this.questions = cachedData;
                    this.updateBadge('Offline (Caché)', 'bg-orange-100 text-orange-800');
                } else {
                    throw new Error("Caché vacía");
                }
            } catch (cacheError) {
                // Usar Preguntas por Defecto
                console.warn('Fallo Caché, usando Fallback.');
                this.questions = FALLBACK_QUESTIONS;
                this.updateBadge('Modo Básico (Sin Red)', 'bg-gray-200 text-gray-700');
                
                // Opcional: Mostrar un aviso visual al usuario
                const toast = document.createElement('div');
                toast.className = "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-sm mb-4";
                toast.innerText = "⚠️ Sin conexión. Mostrando preguntas básicas integradas.";
                this.container.prepend(toast);
            }
        }

        // Renderizar preguntas
        this.renderQuestions();
        this.setLoading(false);
    }

    setLoading(isLoading) {
        if(isLoading) this.container.innerHTML = '<div class="loader mx-auto border-gray-300 border-t-indigo-600"></div>';
    }

    updateBadge(text, classes) {
        if(this.badge) {
            this.badge.textContent = text;
            this.badge.className = `badge ${classes} px-2 py-1 rounded text-xs font-bold`;
        }
    }

    renderStartScreen() {
        // Obtenemos la URL para mostrarla
        const displayUrl = typeof API_URL !== 'undefined' ? API_URL : 'Servidor';
        
        this.container.innerHTML = `
            <div class="text-center py-6">
                <p class="text-gray-600 mb-4 text-sm">Fuente: <span class="font-mono bg-gray-100 px-1 rounded">${displayUrl}</span></p>
                <button id="btn-start-quiz" class="btn-primary py-3 px-8 shadow-lg transform hover:scale-105 transition">
                    🚀 Iniciar Evaluación
                </button>
            </div>
        `;
        const btn = document.getElementById('btn-start-quiz');
        if(btn) btn.addEventListener('click', () => this.load());
    }

    renderQuestions() {

        let html = '';
        if (this.questions === FALLBACK_QUESTIONS) {
             html += `<div class="bg-gray-50 border border-gray-200 text-gray-500 text-xs p-2 rounded mb-4 text-center">Mostrando preguntas preinstaladas</div>`;
        }

        html += '<div class="space-y-4 animate-fade-in">';
        
        this.questions.forEach((q, index) => {
            html += `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm question-card" data-id="${index}">
                    <p class="font-bold text-lg text-gray-800 mb-3"><span class="text-indigo-600">#${index+1}</span> ${q.text}</p>
                    <div class="grid grid-cols-2 gap-3">
                        ${q.options.map(opt => `
                            <button class="bg-white border border-gray-300 py-3 rounded-md hover:bg-indigo-50 hover:border-indigo-300 transition font-medium option-btn" 
                                    data-opt="${opt}">
                                ${opt}
                            </button>
                        `).join('')}
                    </div>
                    <div class="feedback hidden mt-3 text-sm p-3 rounded-md font-medium"></div>
                </div>`;
        });
        
        html += `<button id="btn-reload" class="w-full bg-indigo-100 text-indigo-700 py-3 rounded-lg font-bold hover:bg-indigo-200 transition mt-6">🔄 Intentar Reconectar</button></div>`;
        
        // Inyectamos el HTML
        this.container.innerHTML = html;

        // Listeners
        this.container.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e));
        });
        
        const reloadBtn = document.getElementById('btn-reload');
        if(reloadBtn) reloadBtn.addEventListener('click', () => this.load());
    }

    handleAnswer(e) {
        const btn = e.target;
        const card = btn.closest('.question-card');
        
        // Evitar responder dos veces
        if (card.classList.contains('answered')) return;

        const q = this.questions[card.dataset.id];
        const feedback = card.querySelector('.feedback');
        
        card.classList.add('answered');
        feedback.classList.remove('hidden');

        if (btn.dataset.opt === q.correct) {
            btn.classList.replace('bg-white', 'bg-green-100');
            btn.classList.replace('border-gray-300', 'border-green-500');
            btn.classList.add('text-green-800');
            feedback.innerHTML = `✅ ¡Correcto! ${q.explanation}`;
            feedback.classList.add('bg-green-50', 'text-green-800', 'border', 'border-green-200');
        } else {
            btn.classList.replace('bg-white', 'bg-red-100');
            btn.classList.replace('border-gray-300', 'border-red-500');
            btn.classList.add('text-red-800');
            feedback.innerHTML = `❌ Incorrecto. ${q.explanation}`;
            feedback.classList.add('bg-red-50', 'text-red-800', 'border', 'border-red-200');
            if(navigator.vibrate) navigator.vibrate(200);
        }
    }
}