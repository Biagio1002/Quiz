let questions = [];
let currentIndex = 0;
let score = 0;
let answered = false;

const questionBox = document.getElementById("question-box");
const answersBox = document.getElementById("answers-box");
const feedback = document.getElementById("feedback");
const nextBtn = document.getElementById("next-btn");
const stopBtn = document.getElementById("stop-btn");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.querySelector(".progress-container");
const subjectButtons = document.querySelectorAll(".subject-btn");
const progressText = document.getElementById("progress-text");

// Funzione per randomizzare le domande
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// --- Scelta materia ---
subjectButtons.forEach(btn => {
  btn.onclick = () => {
    const file = btn.dataset.file;

    fetch(file)
      .then(res => res.json())
      .then(data => {
        questions = shuffle(data.questions);
        currentIndex = 0;
        score = 0;

        document.getElementById("subject-box").classList.add("hidden");
        progressContainer.classList.remove("hidden");
        nextBtn.classList.add("hidden");
        stopBtn.classList.remove("hidden");

        showQuestion();
        updateProgress();
      });
  };
});

// --- Mostra domanda ---
function showQuestion() {
  answered = false;
  feedback.textContent = "";
  nextBtn.classList.add("hidden");
  answersBox.innerHTML = "";

  const q = questions[currentIndex];
  questionBox.innerHTML = `<h3>${q.question}</h3>`;

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
      feedback.innerHTML = `Risposta modello:<br><em>${q.answer}</em>`;
      currentIndex++;       // conta la domanda come completata
      updateProgress();     // aggiorna barra e contatore
      nextBtn.classList.remove("hidden");
    };
    answersBox.appendChild(textarea);
    answersBox.appendChild(showBtn);
  }
}

// --- Controllo risposta ---
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

  currentIndex++;       // conta la domanda come completata
  updateProgress();     // aggiorna barra e contatore
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

// --- Stop quiz ---
stopBtn.onclick = () => {
  showFinal();
};

// --- Barra di avanzamento e contatore ---
function updateProgress() {
  const percent = (currentIndex / questions.length) * 100;
  progressBar.style.width = percent + "%";
  progressText.textContent = `${score} / ${currentIndex} domande corrette`;
}

// --- Schermata finale ---
function showFinal() {
  document.getElementById("app").innerHTML = `
    <h2>Quiz completato 🎉</h2>
    <p>Punteggio: ${score} / ${currentIndex}</p>
    <button onclick="location.reload()">Ricomincia</button>
  `;
}

