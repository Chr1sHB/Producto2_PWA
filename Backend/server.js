const express = require('express');
const cors = require('cors');
const path = require('path');
const webpush = require('web-push');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// LLAVES VAPID (Generadas con web-push generate-vapid-keys)
const publicVapidKey = 'BN8QKuz-z57LPlKAlU_OCuW4WRis_Ameg6J1g-poYf3KsmPgqLoXIKsr46b3I5STApYG_qAVXmzXV1uGsRh-1TA';
const privateVapidKey = 'MXeeMV-UqMyNrXIeqr7wjX7GkFlqLOktY83ZpHT6OMU';

webpush.setVapidDetails(
    'mailto:ioricris.2004@gmail.com',
    publicVapidKey,
    privateVapidKey
);

// ARRAY DE SUSCRIPCIONES (Usado como sustituto de base de datos)
let subscriptions = [];

// --- REGISTRO DE PREGUNTAS---
const questionsDB = [
    { id: 1, text: "¿Qué número es mayor?", options: ["-2", "+4"], correct: "+4", explanation: "En la recta, +4 está a la derecha de -2." }, 
    { id: 2, text: "Vallesol tuvo -2°C y Tejar +4°C. ¿Dónde hizo más frío?", options: ["Vallesol", "Tejar"], correct: "Vallesol", explanation: "-2 es menor que +4, por tanto es más frío." }, 
    { id: 3, text: "¿Qué signo corresponde a: +2 ___ -5?", options: [">", "<"], correct: ">", explanation: "Los positivos siempre son mayores que los negativos." }, 
    { id: 4, text: "Ordena de menor a mayor: -3, 0, +2", options: ["-3, 0, +2", "0, -3, +2"], correct: "-3, 0, +2", explanation: "-3 es el que está más a la izquierda." }, 
    { id: 5, text: "¿El número 0 es positivo o negativo?", options: ["Positivo", "Ninguno"], correct: "Ninguno", explanation: "El 0 es el origen, no tiene signo." }, 
    { id: 6, text: "Un número situado a la izquierda del -4 es...", options: ["Mayor", "Menor"], correct: "Menor", explanation: "Cuanto más a la izquierda, menor es el número." }, 
    { id: 7, text: "¿Cuál de estos números está más cerca del 0?", options: ["-1", "+5"], correct: "-1", explanation: "-1 está a solo un paso del 0." }, 
    { id: 8, text: "Si debes 5 pesos, ¿cómo lo representas?", options: ["+5", "-5"], correct: "-5", explanation: "Las deudas o gastos se representan con negativos." }, 
    { id: 9, text: "Completa la serie: -6, -4, -2, ...", options: ["0", "-1"], correct: "0", explanation: "Vamos sumando 2 en cada paso hacia la derecha." }, 
    { id: 10, text: "¿Qué número es mayor: -100 o -1?", options: ["-100", "-1"], correct: "-1", explanation: "-1 está mucho más a la derecha que -100." }, 
    { id: 11, text: "El opuesto de +3 es...", options: ["-3", "0"], correct: "-3", explanation: "Es el mismo número pero con signo contrario." }, 
    { id: 12, text: "En un ascensor, bajar al sótano 2 es ir al piso...", options: ["-2", "+2"], correct: "-2", explanation: "Los niveles bajo tierra son negativos." }, 
    { id: 13, text: "¿Qué temperatura es más alta: -5°C o 0°C?", options: ["-5°C", "0°C"], correct: "0°C", explanation: "0 es mayor que cualquier número negativo." }, 
    { id: 14, text: "Entre -3 y +1, ¿cuántos números enteros hay?", options: ["3 (-2,-1,0)", "2 (-2,-1)"], correct: "3 (-2,-1,0)", explanation: "Los números son -2, -1 y 0." }, 
    { id: 15, text: "Si estás en el -2 y avanzas 3 pasos a la derecha, llegas al...", options: ["+1", "-5"], correct: "+1", explanation: "-2 más 3 es igual a +1." }, 
    { id: 16, text: "¿Qué signo usas para representar 'Altura sobre el nivel del mar'?", options: ["Positivo (+)", "Negativo (-)"], correct: "Positivo (+)", explanation: "Las alturas son positivas, las profundidades negativas." }
];

app.get('/', (req, res) => {
    res.send(`
        <div >
            <h1>SERVIDOR LEVANTADO, ES POSIBLE HACER PETICIONES.</h1>
        </div>
    `);
});

app.get('/api/questions', (req, res) => {
    const shuffled = [...questionsDB].sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, 5));
});

app.get('/api/daily-challenge-view', (req, res) => {
    res.send(`
        <div class="daily-challenge animate-fade-in">
            <p class="font-bold">📅 Reto Push:</p>
            <p>Espera una notificación real del servidor en 10 segundos.</p>
        </div>
    `);
});

// --- RUTAS PUSH ---

// Suscribirse
app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    
    res.status(201).json({ message: 'Suscripción guardada en servidor.' });
    
    // Opcional: Enviar una notificación de bienvenida inmediata para probar
    const payload = JSON.stringify({
        title: '¡Suscripción Exitosa!',
        body: 'Ahora recibirás retos matemáticos.'
    });

    webpush.sendNotification(subscription, payload).catch(err => console.error(err));
});

// 2. Ruta para simular envío de notificación push
app.get('/api/trigger-push', (req, res) => {
    const notificationPayload = JSON.stringify({
        title: 'Reto Matemático 🧠',
        body: '¿Cuál es mayor: -5 o -1? ¡Entra a responder!',
        url: '/#quiz' // Datos extra para el SW
    });

    const promises = subscriptions.map(sub => 
        webpush.sendNotification(sub, notificationPayload).catch(err => {
            console.error("Error enviando a una subscripción (probablemente caducada)", err);
        })
    );

    Promise.all(promises).then(() => res.json({ message: 'Notificaciones enviadas.' }));
});

// Clave pública para el frontend
app.get('/api/vapid-public-key', (req, res) => res.json({ key: publicVapidKey }));

app.listen(port, () => {
    console.log(`Servidor VAPID corriendo en http://localhost:${port}`);
});