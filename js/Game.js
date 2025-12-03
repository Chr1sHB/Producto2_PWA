export const Game = {
    init() {
        this.slider = document.getElementById('game-slider');
        this.robot = document.getElementById('robot-icon');
        this.container = document.getElementById('game-recta-container');
        this.displayVal = document.getElementById('current-pos-display');
        this.displayDesc = document.getElementById('current-pos-desc');
        
        this.renderTicks();
        
        this.slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            this.updatePosition(val);
        });

        this.updatePosition(0);
    },

    renderTicks() {
        let html = '';
        
        html += `<div class="absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-200 z-0"></div>`;

        for(let i = -10; i <= 10; i++) {
            const left = ((i + 10) / 20) * 100;
            const isMajor = i % 5 === 0;
            
            const height = isMajor ? 'h-full' : 'h-2 top-1/2 -translate-y-1/2'; 
            const color = isMajor ? 'bg-gray-500' : 'bg-gray-400';
            const width = isMajor ? 'w-px' : 'w-px';
            
            html += `<div class="absolute ${height} ${color} ${width} transform -translate-x-1/2" style="left: ${left}%;"></div>`;

            // Dibujar números
            if (isMajor) {
                const textVal = i > 0 ? `+${i}` : `${i}`;
                html += `<span class="absolute text-[10px] text-gray-400 bottom-0.5 font-mono transform -translate-x-1/2" style="left: ${left}%;">${textVal}</span>`;
            }
        }
        
        const ticksContainer = document.createElement('div');
        ticksContainer.className = "absolute inset-0 z-0";
        ticksContainer.innerHTML = html;
        this.container.appendChild(ticksContainer);
    },

    updatePosition(val) {
        const percent = ((val + 10) / 20) * 100;
        this.robot.style.left = `${percent}%`;

        let text = val === 0 ? "0" : (val > 0 ? `+${val}` : `${val}`);
        this.displayVal.innerText = text;

        if (val > 0) {
            this.displayVal.className = "text-5xl font-bold text-green-600 transition-colors mt-1";
            this.displayDesc.innerText = "Positivo (Derecha y Mayor a 0)";
            this.displayDesc.className = "text-xs text-green-500 font-bold font-mono h-4";
        } else if (val < 0) {
            this.displayVal.className = "text-5xl font-bold text-red-600 transition-colors mt-1";
            this.displayDesc.innerText = "Negativo(Izquierda y Menor a 0)";
            this.displayDesc.className = "text-xs text-red-500 font-bold font-mono h-4";
        } else {
            this.displayVal.className = "text-5xl font-bold text-gray-800 transition-colors mt-1";
            this.displayDesc.innerText = "Origen (Neutro e Igual a 0)";
            this.displayDesc.className = "text-xs text-gray-400 font-bold font-mono h-4";
        }
        
        if(navigator.vibrate) navigator.vibrate(5);
    }
};