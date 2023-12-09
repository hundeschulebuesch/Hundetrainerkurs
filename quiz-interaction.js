// Konstanten und Hilfsfunktionen
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 24 * 3600000; // 24 Stunden in Millisekunden

// Hilfsfunktionen
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours} Stunden, ${minutes} Minuten und ${seconds} Sekunden`;
}

// Hauptlogik
async function loadMemberData(memberstack) {
  try {
    console.log("Versuche Mitgliederdaten zu laden...");
    const member = await memberstack.getMemberJSON();
    return member.data || { quizAttempts: {} };
  } catch (error) {
    console.error("Fehler beim Laden der Mitgliederdaten: ", error);
    return null;
  }
}

async function handleQuiz(quizName, memberstack) {
  const quizContainer = document.querySelector(".quiz-pruefung-liste");
  if (!quizContainer) {
    console.error("Quiz-Container-Element wurde nicht gefunden.");
    return;
  }

  const attemptInfoBox = document.querySelector(".remaining-time");

  let memberData = await loadMemberData(memberstack);
  if (!memberData) return;

  // Prüfe auf Blockierung des Quiz
  const blockTime = await checkQuizBlock(quizName, memberData, attemptInfoBox);
  if (blockTime) {
    updateRemainingTime(blockTime, attemptInfoBox);
    return;
  }

  // Initialisiere das Quiz
  initializeQuiz(
    quizContainer,
    memberData,
    quizName,
    memberstack,
    attemptInfoBox
  );
}

async function checkQuizBlock(quizName, memberData, attemptInfoBox) {
  if (
    memberData.blockedpruefung &&
    memberData.blockedpruefung.name === quizName
  ) {
    const blockTime = new Date(memberData.blockedpruefung.timestamp);
    const currentTime = new Date();
    const timeRemaining = 24 * 3600000 - (currentTime - blockTime);

    if (timeRemaining > 0) {
      // Update the remaining time using the updateRemainingTime function
      updateRemainingTime(timeRemaining, attemptInfoBox);

      // Format the remaining time and display it
      const formattedTime = formatTime(timeRemaining);
      attemptInfoBox.innerHTML = `<p>${formattedTime} bis zum nächsten Versuch.</p>`;

      return timeRemaining;
    } else {
      delete memberData.blockedpruefung;
      memberData.quizAttempts[quizName] = 0;
      await window.$memberstackDom.updateMemberJSON({ json: memberData });
      console.log("Quizblockierung aufgehoben.");
      return null;
    }
  }
  return null;
}

function initializeQuiz(
  quizContainer,
  memberData,
  quizName,
  memberstack,
  attemptInfoBox
) {
  var quizItems = quizContainer.querySelectorAll(".quiz-grid");
  console.log(`Retrieved ${quizItems.length} quiz items`);

  var submitButton = document.querySelector(".quiz-submit-button");
  var retryButton = document.querySelector(".quiz-retry-button");

  var questionsAnswered = Array.from(quizItems).fill(false);
  setupQuizItems(quizItems, questionsAnswered, submitButton);

  submitButton.addEventListener("click", async function (event) {
    event.preventDefault();
    await handleSubmitButtonClick(
      quizItems,
      memberData,
      quizName,
      memberstack,
      attemptInfoBox,
      retryButton,
      submitButton,
      questionsAnswered
    );
  });

  retryButton.addEventListener("click", async function () {
    await handleRetryButtonClick(
      quizItems,
      memberData,
      quizName,
      memberstack,
      attemptInfoBox,
      retryButton,
      submitButton,
      questionsAnswered
    );
  });

  // Initialisiere den Zustand des "Prüfung absenden"-Buttons
  updateSubmitButtonState(questionsAnswered, submitButton);
}

function setupQuizItems(quizItems, questionsAnswered, submitButton) {
  console.log("Los geht's");
  quizItems.forEach((item, index) => {
    console.log(`Setting up quiz item ${index + 1}`);

    // Extract answers and indices of correct answers
    const answersTexts = Array.from(
      item.querySelectorAll(".hidden-rich-text-antworten p")
    )
      .map((el) => el.textContent.trim())
      .filter((text) => text !== ""); // Filter out empty answer options

    console.log(
      `Extracted ${answersTexts.length} answers for quiz item ${index + 1}`
    );

    const correctAnswerLetters = item
      .querySelector(".right-answers-hidden-text")
      .textContent.trim()
      .split(",");

    console.log(`Extracted correct answer letters for quiz item ${index + 1}`);

    const correctAnswerIndices = correctAnswerLetters.map(
      (letter) => letter.charCodeAt(0) - "a".charCodeAt(0)
    );

    // Create answer objects with text and isCorrect flag
    const answerObjects = answersTexts.map((text, idx) => ({
      text,
      isCorrect: correctAnswerIndices.includes(idx),
    }));

    // Shuffle the answer objects
    shuffleArray(answerObjects);

    console.log(`Shuffled answers for quiz item ${index + 1}`);

    // Create a div for interactive answers
    const answersDiv = document.createElement("div");
    answersDiv.className = "interactive-answers";

    // Create individual answer divs
    answerObjects.forEach((answer) => {
      const answerDiv = document.createElement("div");
      answerDiv.className = "answer";
      answerDiv.textContent = answer.text;
      answerDiv.dataset.isCorrect = answer.isCorrect;

      // Event listener for selecting an answer
      answerDiv.addEventListener("click", function () {
        if (!this.classList.contains("answerBlocked")) {
          this.classList.toggle("selected");
          questionsAnswered[index] =
            item.querySelector(".answer.selected") !== null;
          // Optional: Update the state of the "Submit Quiz" button here
          updateSubmitButtonState(questionsAnswered, submitButton);
          console.log(`Answer selected for quiz item ${index + 1}`);
        }
      });

      answersDiv.appendChild(answerDiv);
    });

    item.querySelector(".answers-box").appendChild(answersDiv);

    console.log(`Quiz item ${index + 1} setup complete`);
  });
}

function updateSubmitButtonState(questionsAnswered, submitButton) {
  // Überprüfen, ob alle Fragen beantwortet wurden
  const allQuestionsAnswered = questionsAnswered.every((answered) => answered);

  // Aktivieren oder Deaktivieren des Submit-Buttons basierend auf dem Status der Fragen
  if (allQuestionsAnswered) {
    submitButton.removeAttribute("disabled");
    submitButton.classList.remove("disabled");
    submitButton.setAttribute(
      "data-tooltip",
      "Klicke, um die Prüfung abzuschicken"
    );
    console.log("Alle Fragen wurden beantwortet. Submit-Button aktiviert.");
    submitButton.style.pointerEvents = "auto"; // Aktiviert das Klicken
    submitButton.style.userSelect = "none"; // Verhindert Textmarkierung
  } else {
    submitButton.setAttribute("disabled", "");
    submitButton.classList.add("disabled");
    submitButton.setAttribute(
      "data-tooltip",
      "Beantworte alle Fragen, um die Prüfung abzusenden"
    );
    console.log(
      "Nicht alle Fragen wurden beantwortet. Submit-Button deaktiviert."
    );
    submitButton.style.pointerEvents = "none"; // Deaktiviert das Klicken
    submitButton.style.userSelect = "none"; // Verhindert Textmarkierung
  }
}

async function handleSubmitButtonClick(
  quizItems,
  memberData,
  quizName,
  memberstack,
  attemptInfoBox,
  retryButton,
  submitButton,
  questionsAnswered
) {
  let allCorrect = true;

  // Gehe jedes Quiz-Element durch und überprüfe die Antworten
  quizItems.forEach((item) => {
    const selectedAnswers = item.querySelectorAll(".answer.selected");

    selectedAnswers.forEach((selectedAnswer) => {
      if (selectedAnswer.dataset.isCorrect === "true") {
        selectedAnswer.classList.add("correct");
      } else {
        selectedAnswer.classList.add("wrong");
        allCorrect = false;
      }
    });

    item.querySelectorAll(".answer").forEach((answer) => {
      answer.classList.add("no-click");
    });
  });

  // Aktualisiere die Anzahl der Versuche und überprüfe die Quiz-Sperre
  if (!allCorrect) {
    memberData.quizAttempts[quizName] = memberData.quizAttempts[quizName]
      ? memberData.quizAttempts[quizName] + 1
      : 1;

    let remainingAttempts = 5 - memberData.quizAttempts[quizName];
    attemptInfoBox.textContent = `Verbleibende Versuche: ${remainingAttempts}`;

    if (remainingAttempts <= 0) {
      memberData.blockedpruefung = {
        name: quizName,
        timestamp: new Date().toISOString(),
      };

      quizItems.forEach((item) => {
        item.querySelectorAll(".answer").forEach((answer) => {
          answer.classList.add("answerBlocked");
        });
      });
    }

    await memberstack.updateMemberJSON({ json: memberData });
  }

  // Verwalte die Button-Anzeige
  retryButton.style.display = "block";
  submitButton.style.display = "none";

  // Optional: Benutzerfeedback zum Quiz-Ergebnis
  console.log(
    "Prüfung abgeschlossen. Ergebnis: " +
      (allCorrect ? "Bestanden" : "Nicht bestanden")
  );

  // Setze den Fragestatus und den Zustand des "Prüfung absenden"-Buttons zurück
  questionsAnswered.fill(false);
  updateSubmitButtonState(questionsAnswered, submitButton);
}

async function handleRetryButtonClick(
  quizItems,
  memberData,
  quizName,
  memberstack,
  attemptInfoBox,
  retryButton,
  submitButton,
  questionsAnswered
) {
  // Überprüfe, ob das Quiz gesperrt ist und die Sperrzeit abgelaufen ist
  if (
    memberData.blockedpruefung &&
    memberData.blockedpruefung.name === quizName
  ) {
    const blockTime = new Date(memberData.blockedpruefung.timestamp);
    const currentTime = new Date();
    const timeRemaining = 24 * 3600000 - (currentTime - blockTime);

    if (timeRemaining > 0) {
      // Zeige die verbleibende Zeit an und beende die Funktion
      const timeMessage = `Du musst noch ${Math.floor(
        timeRemaining / 3600000
      )} Stunden, ${Math.floor(
        (timeRemaining % 3600000) / 60000
      )} Minuten und ${Math.floor(
        (timeRemaining % 60000) / 1000
      )} Sekunden warten, bevor du dieses Quiz erneut versuchen kannst.`;
      attemptInfoBox.innerHTML = `<p>${timeMessage}</p>`;
      return;
    } else {
      // Wenn die Sperrzeit abgelaufen ist, entferne die Sperrinformationen und setze Versuche zurück
      delete memberData.blockedpruefung;
      memberData.quizAttempts[quizName] = 0;
      await memberstack.updateMemberJSON({ json: memberData });
    }
  }

  // Setze das Quiz zurück
  quizItems.forEach((item) => {
    item.querySelectorAll(".answer").forEach((answer) => {
      answer.classList.remove(
        "selected",
        "correct",
        "wrong",
        "no-click",
        "answerBlocked"
      );
    });
  });

  // Setze den Fragestatus und den Zustand des "Prüfung absenden"-Buttons zurück
  questionsAnswered.fill(false);
  updateSubmitButtonState(questionsAnswered, submitButton);

  // Setze die Anzeige der Buttons zurück
  submitButton.style.display = "block";
  retryButton.style.display = "none";

  // Optional: Nachricht zur Wiederholung des Quiz
  console.log("Quiz zurückgesetzt und bereit für einen neuen Versuch.");
}

function updateRemainingTime(timeRemaining, timerElement) {
  // Update the time display immediately
  timerElement.innerHTML = formatTime(timeRemaining);

  // Update the time display in real-time
  const countdownInterval = 1000; // Update every 1 second (1000 milliseconds)
  const countdownTimer = setInterval(function () {
    timeRemaining -= 1000; // Subtract 1 second (1000 milliseconds)
    if (timeRemaining <= 0) {
      // Time has run out, clear the interval
      clearInterval(countdownTimer);
      timerElement.innerHTML = "Time's up!";
      // You can perform any actions needed when time runs out here
    } else {
      // Update the time display
      timerElement.innerHTML = formatTime(timeRemaining);
    }
  }, countdownInterval);
}

// Initialisierung
document.addEventListener("DOMContentLoaded", async function () {
  const memberstack = window.$memberstackDom;
  const quizName = document
    .querySelector("[pruefung-name]")
    .getAttribute("pruefung-name");
  await handleQuiz(quizName, memberstack);
});
