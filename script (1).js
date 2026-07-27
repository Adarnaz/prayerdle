// ==========================================
// 1. BANCO DE DATOS (CITAS BÍBLICAS)
// ==========================================
const bibleQuotes = [
    {
        // El texto completo de la cita
        text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
        // La referencia oficial
        reference: "Juan 3:16",
        // Variantes aceptadas para que el usuario no pierda por un detalle de formato
        validAnswers: ["juan 3 16", "juan 3:16", "san juan 3 16", "san juan 3:16"]
    },
    {
        text: "El Señor es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.",
        reference: "Salmos 23:1-2",
        validAnswers: ["salmos 23 1", "salmo 23 1", "salmos 23:1", "salmo 23:1", "salmos 23 1-2", "salmos 23:1-2"]
    },
    {
        text: "Todo lo puedo en Cristo que me fortalece.",
        reference: "Filipenses 4:13",
        validAnswers: ["filipenses 4 13", "filipenses 4:13"]
    },
    {
        text: "En el principio creó Dios los cielos y la tierra.",
        reference: "Génesis 1:1",
        validAnswers: ["genesis 1 1", "genesis 1:1"]
    }
];

// Porcentajes de palabras reveladas por intento (el primero siempre es "solo 1 palabra")
// intento 1 -> 1 palabra | intento 2 -> 15% | intento 3 -> 30% | intento 4 -> 50% | intento 5 -> 100%
const REVEAL_PERCENTAGES = [null, 0.15, 0.30, 0.50, 1];
const MAX_ATTEMPTS = REVEAL_PERCENTAGES.length;

// ==========================================
// 2. ESTADO DEL JUEGO
// ==========================================
let currentQuote = null;
let wordsArray = [];
let revealSteps = []; // Cantidad de palabras a revelar en cada intento, calculada según el largo del pasaje
let currentAttempt = 0; // De 0 a 4 (5 intentos en total)
let attemptResults = []; // 'pending' | 'wrong' | 'correct' para cada intento (para las pills)
let gameOver = false;

// Calcula cuántas palabras se revelan en cada intento según el % y el total de palabras del pasaje.
// Garantiza que cada paso muestre siempre más palabras que el anterior (nunca se repite ni se estanca).
function computeRevealSteps(totalWords) {
    const steps = [];
    let previous = 0;

    REVEAL_PERCENTAGES.forEach((percentage, index) => {
        let count;
        if (percentage === null) {
            // Primer intento: siempre exactamente 1 palabra
            count = 1;
        } else if (index === REVEAL_PERCENTAGES.length - 1) {
            // Último intento: siempre el pasaje completo
            count = totalWords;
        } else {
            count = Math.round(totalWords * percentage);
        }

        // Aseguramos progresión estricta: al menos 1 palabra más que el paso anterior
        count = Math.max(count, previous + 1);
        // Y nunca más palabras de las que tiene el pasaje
        count = Math.min(count, totalWords);

        steps.push(count);
        previous = count;
    });

    return steps;
}

// ==========================================
// 3. REFERENCIAS AL DOM
// ==========================================
const verseTextEl = document.getElementById('verse-text');
const guessForm = document.getElementById('guess-form');
const verseInput = document.getElementById('verse-input');
const guessesHistoryEl = document.getElementById('guesses-history');
const intentosRestantesEl = document.getElementById('intentos-restantes');
const pills = document.querySelectorAll('.attempt-pill');

// ==========================================
// 4. INICIALIZACIÓN DEL JUEGO
// ==========================================
function initGame() {
    // Seleccionar cita del día (aquí elegimos una al azar o basada en la fecha)
    const todayIndex = Math.floor(Math.random() * bibleQuotes.length);
    currentQuote = bibleQuotes[todayIndex];

    // Limpiar y separar las palabras del texto
    wordsArray = currentQuote.text.trim().split(/\s+/);
    revealSteps = computeRevealSteps(wordsArray.length);
    currentAttempt = 0;
    attemptResults = new Array(MAX_ATTEMPTS).fill('pending');
    gameOver = false;

    // Limpiar historial de intentos previos (por si se reinicia la partida)
    guessesHistoryEl.innerHTML = '';
    intentosRestantesEl.style.color = '';
    verseInput.disabled = false;
    document.getElementById('submit-btn').disabled = false;

    renderVerse();
    updateUI();
}

// ==========================================
// 5. RENDERIZADO Y ACTUALIZACIÓN DE INTERFAZ
// ==========================================
function renderVerse() {
    const wordsToRevealCount = revealSteps[currentAttempt];
    let visibleWords = [];

    if (wordsToRevealCount >= wordsArray.length) {
        // Revelar el texto completo
        visibleWords = wordsArray;
    } else {
        // Tomar solo la cantidad de palabras del intento actual
        visibleWords = wordsArray.slice(0, wordsToRevealCount);
    }

    // Construir el HTML con las palabras reveladas y puntos suspensivos si faltan
    let html = visibleWords.map(word => `<span class="revealed-word">${word}</span>`).join(' ');

    if (wordsToRevealCount < wordsArray.length) {
        html += ' <span class="hidden-word">...</span>';
    }

    verseTextEl.innerHTML = html;
}

function updateUI() {
    // Actualizar píldoras de progreso: cada una refleja su propio estado
    pills.forEach((pill, index) => {
        pill.classList.remove('active', 'wrong', 'correct');
        pill.innerHTML = '';

        const state = attemptResults[index];

        if (state === 'wrong') {
            pill.classList.add('wrong');
            pill.innerHTML = '<span class="pill-icon">✕</span>';
        } else if (state === 'correct') {
            pill.classList.add('correct');
            pill.innerHTML = '<span class="pill-icon">✓</span>';
        } else if (index === currentAttempt) {
            pill.classList.add('active');
        }
    });

    // Texto de intentos restantes
    if (!gameOver) {
        intentosRestantesEl.textContent = `Intento ${currentAttempt + 1} de ${MAX_ATTEMPTS}`;
    }
}

// Normaliza el texto quitando acentos, mayúsculas y caracteres especiales
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
        .replace(/[^a-z0-9\s]/g, "")     // Quitar puntos, comas, dos puntos
        .trim();
}

// ==========================================
// 6. LÓGICA DE VALIDACIÓN Y MANEJO DE INTENTOS
// ==========================================
guessForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (gameOver) return;

    const userGuess = verseInput.value;
    const normalizedUserGuess = normalizeText(userGuess);
    
    if (!normalizedUserGuess) return;

    // Comprobar si la respuesta coincide con alguna de las variaciones válidas
    const isCorrect = currentQuote.validAnswers.some(
        answer => normalizeText(answer) === normalizedUserGuess
    );

    if (isCorrect) {
        handleWin();
    } else {
        handleWrongGuess(userGuess);
    }

    verseInput.value = '';
});

function handleWrongGuess(guessedText) {
    // Añadir al historial de intentos fallidos
    const guessItem = document.createElement('div');
    guessItem.className = 'guess-item wrong';
    guessItem.innerHTML = `❌ <span>${guessedText}</span>`;
    guessesHistoryEl.appendChild(guessItem);

    attemptResults[currentAttempt] = 'wrong';
    currentAttempt++;

    if (currentAttempt < MAX_ATTEMPTS) {
        renderVerse();
        updateUI();
    } else {
        updateUI();
        handleLoss();
    }
}

function handleWin() {
    gameOver = true;
    attemptResults[currentAttempt] = 'correct';
    // Mostrar todo el texto completo
    currentAttempt = MAX_ATTEMPTS - 1;
    renderVerse();
    updateUI();

    intentosRestantesEl.textContent = "¡CORRECTO!";
    intentosRestantesEl.style.color = "var(--success)";

    // Mensaje final
    const winItem = document.createElement('div');
    winItem.className = 'guess-item';
    winItem.style.backgroundColor = 'var(--success-bg)';
    winItem.style.color = 'var(--success)';
    winItem.innerHTML = `🎉 ¡Has acertado! Era <strong>${currentQuote.reference}</strong>`;
    guessesHistoryEl.appendChild(winItem);

    verseInput.disabled = true;
    document.getElementById('submit-btn').disabled = true;
}

function handleLoss() {
    gameOver = true;
    intentosRestantesEl.textContent = "HAS PERDIDO";
    intentosRestantesEl.style.color = "var(--error)";

    const lossItem = document.createElement('div');
    lossItem.className = 'guess-item wrong';
    lossItem.innerHTML = `📖 La cita correcta era: <strong>${currentQuote.reference}</strong>`;
    guessesHistoryEl.appendChild(lossItem);

    verseInput.disabled = true;
    document.getElementById('submit-btn').disabled = true;
}

// Cargar el juego al iniciar la página
document.addEventListener('DOMContentLoaded', initGame);