import { StorageManager } from './Storage.js';
import { API_URL } from './config.js'; // Importamos la dirección del servidor

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
        try {
            // USAMOS LA URL ABSOLUTA DEL BACKEND
            const res = await fetch(`${API_URL}/api/questions`);
            
            if (!res.ok) throw new Error('Error de conexión con Backend');
            
            this.questions = await res.json();
            
            // Guardar en IDB para cuando no haya conexión con el backend
            await this.storage.saveQuestions(this.questions);
            this.updateBadge('Online (Servidor)', 'bg-green-100 text-green-800');
            this.renderQuestions();

        } catch (error) {
            console.log('Fallo de conexión, usando caché:', error);
            this.questions = await this.storage.getQuestions();
            
            if (this.questions.length > 0) {
                this.updateBadge('Offline (Caché Local)', 'bg-orange-100 text-orange-800');
                this.renderQuestions();
            } else {
                this.updateBadge('Desconectado', 'bg-red-100 text-red-800');
                this.renderError("No se puede conectar al servidor y no hay datos guardados.");
            }
        }
        this.setLoading(false);
    }

    setLoading(isLoading) { if(isLoading) this.container.innerHTML = '<div class="loader mx-auto"></div>'; }
    updateBadge(text, classes) { this.badge.textContent = text; this.badge.className = `badge ${classes}`; }

    renderStartScreen() {
        this.container.innerHTML = `
            <div class="text-center">
                <p class="mb-4 text-gray-600">Conectando con: <span class="text-xs bg-gray-200 p-1 rounded">${API_URL}</span></p>
                <button id="btn-start-quiz" class="btn-primary shadow-lg">🔄 Iniciar Evaluación</button>
            </div>
        `;
        document.getElementById('btn-start-quiz').addEventListener('click', () => this.load());
    }

    renderQuestions() {
        let html = '<div class="space-y-4 fade-in">';
        this.questions.forEach((q, index) => {
            html += `
                <div class="bg-gray-100 p-4 rounded border-l-4 border-indigo-500 question-card" data-id="${index}">
                    <p class="font-bold text-lg text-gray-800">${index + 1}. ${q.text}</p>
                    <div class="mt-3 flex gap-2">
                        ${q.options.map(opt => `<button class="bg-white border border-gray-300 px-4 py-2 rounded hover:bg-indigo-50 flex-1 transition option-btn" data-opt="${opt}">${opt}</button>`).join('')}
                    </div>
                    <div class="feedback hidden mt-2 text-sm p-2 rounded"></div>
                </div>`;
        });
        html += `<button id="btn-reload" class="btn-primary mt-4">Recargar Test</button></div>`;
        this.container.innerHTML = html;
        this.container.querySelectorAll('.option-btn').forEach(btn => btn.addEventListener('click', (e) => this.handleAnswer(e)));
        document.getElementById('btn-reload').addEventListener('click', () => this.load());
    }

    handleAnswer(e) {
        const btn = e.target;
        const card = btn.closest('.question-card');
        const q = this.questions[card.dataset.id];
        if (card.classList.contains('answered')) return;
        card.classList.add('answered');
        const fb = card.querySelector('.feedback');
        fb.classList.remove('hidden');
        
        if (btn.dataset.opt === q.correct) {
            btn.classList.add('bg-green-200'); fb.innerHTML = `✅ ${q.explanation}`; fb.classList.add('bg-green-100');
        } else {
            btn.classList.add('bg-red-200'); fb.innerHTML = `❌ ${q.explanation}`; fb.classList.add('bg-red-100');
            if(navigator.vibrate) navigator.vibrate(200);
        }
    }
    
    renderError(msg) { this.container.innerHTML = `<div class="p-4 text-red-600 border border-red-300 bg-red-50 rounded">${msg}<br><button id="btn-retry" class="btn-primary mt-2">Reintentar</button></div>`; document.getElementById('btn-retry').addEventListener('click', () => this.load()); }
}