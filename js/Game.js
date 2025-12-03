export const Game = {
    target: 0,
    currentPos: 0,
    
    init() {
        this.generateTarget();
        this.setupListeners();
    },

    generateTarget() {
        // Aleatorio entre -9 y 9
        this.target = Math.floor(Math.random() * 19) - 9;
        const sign = this.target > 0 ? "+" : "";
        document.getElementById('target-val').innerText = `${sign}${this.target}`;
    },

    setupListeners() {
        const slider = document.getElementById('game-slider');
        const checkBtn = document.getElementById('btn-check-game');
        
        // Slider manual
        slider.addEventListener('input', (e) => {
            this.updateRobot(parseInt(e.target.value));
        });

        // Botón comprobar
        checkBtn.addEventListener('click', () => this.check());

        // Hardware: Acelerómetro
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                const tilt = e.gamma; // Izquierda/Derecha
                if (tilt !== null) {
                    let val = Math.round(tilt / 3);
                    if (val < -10) val = -10;
                    if (val > 10) val = 10;
                    
                    // Solo actualizar si la diferencia es significativa
                    if(Math.abs(val - this.currentPos) >= 1) {
                         this.updateRobot(val);
                         slider.value = val;
                    }
                }
            });
        }
    },

    updateRobot(val) {
        this.currentPos = val;
        // Mapear -10..10 a 0%..100%
        const percent = ((val + 10) / 20) * 100;
        document.getElementById('robot-icon').style.left = `${percent}%`;
    },

    check() {
        if (this.currentPos === this.target) {
            alert("¡Excelente! 🎉 Has encontrado el número.");
            this.generateTarget();
        } else {
            alert(`Casi... Estás en ${this.currentPos}, busca el ${this.target}`);
            if (navigator.vibrate) navigator.vibrate([100,50,100]);
        }
    }
};