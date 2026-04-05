let allData = null;       // intero JSON caricato
let questions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let currentMode = "quiz"; // "quiz" | "edit"
let selectedFile = "";

const questionBox = document.getElementById("question-box");
const answersBox = document.getElementById("answers-box");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const stopBtn = document.getElementById("stop-btn");
const exportBtn = document.getElementById("export-btn");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.querySelector(".progress-container");
const subjectButtons = document.querySelectorAll(".subject-btn");
const progressText = document.getElementById("progress-text");
const modeBox = document.getElementById("mode-box");
const modeQuizBtn = document.getElementById("mode-quiz-btn");
const modeEditBtn = document.getElementById("mode-edit-btn");

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// --- Scelta materia: mostra selezione modalità ---
subjectButtons.forEach(btn => {
  btn.onclick = () => {
    selectedFile = btn.dataset.file;
    fetch(selectedFile)
      .then(res => res.json())
      .then(data => {
        allData = data;
        // mostra scelta modalità
        subjectButtons.forEach(b => b.classList.add("hidden"));
        document.querySelector("#subject-box p").classList.add("hidden");
        modeBox.classList.remove("hidden");
      });
  };
});

// --- Modalità Quiz ---
modeQuizBtn.onclick = () => {
  currentMode = "quiz";
  questions = shuffle([...allData.questions]);
  startSession();
};

// --- Modalità Modifica ---
modeEditBtn.onclick = () => {
  const user = prompt("Username:");
  const pass = prompt("Password:");
  if (user !== "admin" || pass !== "admin") {
    alert("❌ Credenziali errate.");
    return;
  }

  currentMode = "edit";
  // solo domande multiple con answer null
  questions = allData.questions.filter(q => q.type === "multiple" && q.answer === null);
  if (questions.length === 0) {
    modeBox.innerHTML = `<p>✅ Nessuna risposta mancante! Tutte le domande chiuse hanno già una risposta.</p>
      <button onclick="location.reload()">Torna all'inizio</button>`;
    return;
  }
  startSession();
};

function startSession() {
  currentIndex = 0;
  score = 0;
  document.getElementById("subject-box").classList.add("hidden");
  progressContainer.classList.remove("hidden");
  nextBtn.classList.add("hidden");
  stopBtn.classList.remove("hidden");
  exportBtn.classList.add("hidden");
  showQuestion();
  updateProgress();
}

// --- Mostra domanda ---
function showQuestion() {
  answered = false;
  feedback.textContent = "";
  nextBtn.classList.add("hidden");
  answersBox.innerHTML = "";

  const q = questions[currentIndex];
  questionBox.innerHTML = `
    <p class="question-meta">${q.lezione}</p>
    <h3>${q.question}</h3>
  `;

  if (currentMode === "edit") {
    showEditQuestion(q);
  } else {
    showQuizQuestion(q);
  }
}

function showQuizQuestion(q) {
  if (q.type === "multiple") {
    q.options.forEach(option => {
      const btn = document.createElement("button");
      btn.textContent = option;
      btn.className = "option";
      btn.onclick = () => checkAnswer(btn, option);
      answersBox.appendChild(btn);
    });
  } else {
    const textarea = document.createElement("textarea");
    const showBtn = document.createElement("button");
    showBtn.textContent = "Mostra risposta";
    showBtn.style.marginTop = "0.5rem";
    showBtn.onclick = () => {
      feedback.innerHTML = q.answer
        ? `Risposta modello:<br><em>${q.answer}</em>`
        : `<em>Nessuna risposta disponibile per questa domanda aperta.</em>`;
      currentIndex++;
      updateProgress();
      nextBtn.classList.remove("hidden");
    };
    answersBox.appendChild(textarea);
    answersBox.appendChild(showBtn);
  }
}

function showEditQuestion(q) {
  const info = document.createElement("p");
  info.className = "edit-info";
  info.textContent = "Seleziona la risposta corretta:";
  answersBox.appendChild(info);

  q.options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.className = "option";
    btn.onclick = () => saveAnswer(btn, option, q);
    answersBox.appendChild(btn);
  });
}

// --- Salva risposta in modalità modifica ---
function saveAnswer(button, selected, q) {
  if (answered) return;
  answered = true;

  // aggiorna nel dataset originale
  const original = allData.questions.find(item => item.id === q.id);
  if (original) original.answer = selected;

  const buttons = document.querySelectorAll(".option");
  buttons.forEach(b => b.disabled = true);
  button.classList.add("correct");
  feedback.textContent = `✅ Risposta salvata: "${selected}"`;

  currentIndex++;
  updateProgress();
  nextBtn.classList.remove("hidden");
}

// --- Controllo risposta quiz ---
function checkAnswer(button, selected) {
  if (answered) return;
  answered = true;

  const q = questions[currentIndex];
  const buttons = document.querySelectorAll(".option");
  buttons.forEach(b => b.disabled = true);

  if (selected === q.answer) {
    button.classList.add("correct");
    feedback.textContent = "✅ Corretta!";
    score++;
  } else {
    button.classList.add("wrong");
    feedback.textContent = `❌ Sbagliata. Risposta corretta: ${q.answer}`;
    buttons.forEach(b => {
      if (b.textContent === q.answer) b.classList.add("correct");
    });
  }

  currentIndex++;
  updateProgress();
  nextBtn.classList.remove("hidden");
}

// --- Avanzamento ---
nextBtn.onclick = () => {
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showFinal();
  }
};

// --- Stop ---
stopBtn.onclick = () => {
  showFinal();
};

// --- Progresso ---
function updateProgress() {
  const percent = (currentIndex / questions.length) * 100;
  progressBar.style.width = percent + "%";
  if (currentMode === "edit") {
    progressText.textContent = `${currentIndex} / ${questions.length} modificate`;
  } else {
    progressText.textContent = `${score} / ${currentIndex} corrette`;
  }
}

// --- Schermata finale ---
function showFinal() {
  stopBtn.classList.add("hidden");
  nextBtn.classList.add("hidden");
  answersBox.innerHTML = "";
  feedback.textContent = "";
  progressContainer.classList.add("hidden");

  if (currentMode === "edit") {
    const saved = questions.filter(q => q.answer !== null).length;
    questionBox.innerHTML = `
      <h2>Modifica completata ✏️</h2>
      <p>${saved} risposte salvate su ${questions.length} domande.</p>
      <p>Scarica il JSON aggiornato e sostituisci il file nel progetto.</p>
    `;
    exportBtn.classList.remove("hidden");
  } else {
    questionBox.innerHTML = `
      <h2>Quiz completato 🎉</h2>
      <p>Punteggio: ${score} / ${questions.length}</p>
    `;
    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Ricomincia";
    restartBtn.style.cssText = "width:100%;padding:0.8rem;margin-top:0.5rem;font-size:1rem;border-radius:8px;background:#4caf50;color:white;";
    restartBtn.onclick = () => location.reload();
    answersBox.appendChild(restartBtn);
  }
}

// --- Export JSON ---
exportBtn.onclick = () => {
  const json = JSON.stringify(allData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = selectedFile;
  a.click();
  URL.revokeObjectURL(url);
};
