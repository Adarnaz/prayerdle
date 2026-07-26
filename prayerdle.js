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

// Pasos de palabras reveladas por intento: 1, 3, 5, 10, y luego todas (-1)
const REVEAL_STEPS = [1, 3, 5, 10, -1];
const MAX_ATTEMPTS = REVEAL_STEPS.length;

// ==========================================
// 2. ESTADO DEL JUEGO
// ==========================================
let currentQuote = null;
let wordsArray = [];
let currentAttempt = 0; // De 0 a 4 (5 intentos en total)
let gameOver = false;

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
    currentAttempt = 0;
    gameOver = false;

    renderVerse();
    updateUI();
}

// ==========================================
// 5. RENDERIZADO Y ACTUALIZACIÓN DE INTERFAZ
// ==========================================
function renderVerse() {
    const wordsToRevealCount = REVEAL_STEPS[currentAttempt];
    let visibleWords = [];

    if (wordsToRevealCount === -1 || wordsToRevealCount >= wordsArray.length) {
        // Revelar el texto completo
        visibleWords = wordsArray;
    } else {
        // Tomar solo la cantidad de palabras del intento actual
        visibleWords = wordsArray.slice(0, wordsToRevealCount);
    }

    // Construir el HTML con las palabras reveladas y puntos suspensivos si faltan
    let html = visibleWords.map(word => `<span class="revealed-word">${word}</span>`).join(' ');
    
    if (wordsToRevealCount !== -1 && wordsToRevealCount < wordsArray.length) {
        html += ' <span class="hidden-word">...</span>';
    }

    verseTextEl.innerHTML = html;
}

function updateUI() {
    // Actualizar píldoras de progreso
    pills.forEach((pill, index) => {
        if (index === currentAttempt) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // Texto de intentos restantes
    intentosRestantesEl.textContent = `Intento ${currentAttempt + 1} de ${MAX_ATTEMPTS}`;
}

// Normaliza el texto quitando acentos, mayúsculas y caracteres especiales
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Eliminar tildes
        .replace(/[^a-z0-9\s]/g, "")     : // Quitar puntos, comas, dos puntos
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

    currentAttempt++;

    if (currentAttempt < MAX_ATTEMPTS) {
        renderVerse();
        updateUI();
    } else {
        handleLoss();
    }
}

function handleWin() {
    gameOver = true;
    // Mostrar todo el texto completo
    currentAttempt = REVEAL_STEPS.length - 1;
    renderVerse();

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