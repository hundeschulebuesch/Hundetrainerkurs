document.addEventListener("DOMContentLoaded", async function () {
    const memberstack = window.$memberstackDom;
    const quizName = document
      .querySelector("[pruefung-name]")
      .getAttribute("pruefung-name");
    const quizContainer = document.querySelector(".quiz-grid");
    if (!quizContainer) {
      console.error("Quiz-Container-Element wurde nicht gefunden.");
      return;
    }
    const attemptInfoBox = document.createElement("div");
    attemptInfoBox.className = "attempt-info-box";
    quizContainer.appendChild(attemptInfoBox);
  
    let memberData;
  
    try {
      const member = await memberstack.getMemberJSON();
      memberData = member.data || {};
  
      if (!memberData.quizAttempts) {
        memberData.quizAttempts = {};
      }
  
      if (
        memberData.blockedpruefung &&
        memberData.blockedpruefung.name === quizName
      ) {
        const blockTime = new Date(memberData.blockedpruefung.timestamp);
        const currentTime = new Date();
  
        if ((currentTime - blockTime) / 3600000 < 24) {
          quizContainer.innerHTML =
            "<p>Du musst 24 Stunden warten, bevor du dieses Quiz erneut versuchen kannst.</p>";
          return;
        } else {
          delete memberData.blockedpruefung;
          memberData.quizAttempts[quizName] = 0;
          await memberstack.updateMemberJSON({ json: memberData });
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden der Mitgliederdaten: ", error);
      return;
    }
  
    var quizItems = document.querySelectorAll(".quiz-item");
    var submitButton = document.querySelector(".quiz-submit-button");
    var retryButton = document.querySelector(".quiz-retry-button");
  
    // Füge eine Variable hinzu, um den Status der Fragen zu verfolgen
    var questionsAnswered = Array.from(quizItems).fill(false);
  
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  
    quizItems.forEach(function (item, index) {
      var answers = Array.from(
        item.querySelectorAll(".hidden-rich-text-antworten p")
      )
        .map((el) => el.textContent.trim())
        .filter((text) => text !== ""); // Filtere leere Antwortmöglichkeiten
      var correctAnswerLetters = item
        .querySelector(".right-answers-hidden-text")
        .textContent.trim()
        .split(",");
      var correctAnswerIndices = correctAnswerLetters.map(
        (letter) => letter.charCodeAt(0) - "a".charCodeAt(0)
      );
  
      var answerObjects = answers.map((text, index) => ({
        text,
        isCorrect: correctAnswerIndices.includes(index),
      }));
  
      shuffleArray(answerObjects);
  
      var answersDiv = document.createElement("div");
      answersDiv.className = "interactive-answers";
  
      answerObjects.forEach(function (answer) {
        var answerDiv = document.createElement("div");
        answerDiv.className = "answer";
        answerDiv.textContent = answer.text;
        answerDiv.dataset.isCorrect = answer.isCorrect;
  
        answerDiv.addEventListener("click", function () {
          this.classList.toggle("selected");
          // Aktualisiere den Status der Frage
          questionsAnswered[index] =
            item.querySelector(".answer.selected") !== null;
          // Aktualisiere den Zustand des "Prüfung absenden"-Buttons
          updateSubmitButtonState();
        });
  
        answersDiv.appendChild(answerDiv);
      });
  
      item.querySelector(".answers-box").appendChild(answersDiv);
    });
  
    function updateSubmitButtonState() {
      // Überprüfe, ob alle Fragen beantwortet wurden
      const allQuestionsAnswered = questionsAnswered.every(
        (answered) => answered
      );
      // Aktiviere oder deaktiviere den "Prüfung absenden"-Button entsprechend
      submitButton.disabled = !allQuestionsAnswered;
  
      // Aktualisiere die visuelle Darstellung des Buttons und füge einen Tooltip hinzu
      if (allQuestionsAnswered) {
        submitButton.classList.remove("disabled");
        submitButton.title = "Klicke hier, um die Prüfung abzusenden";
      } else {
        submitButton.classList.add("disabled");
        submitButton.title = "Beantworte alle Fragen, um die Prüfung abzusenden";
      }
    }
  
    submitButton.addEventListener("click", async function (event) {
      event.preventDefault();
      var allCorrect = true;
  
      quizItems.forEach(function (item) {
        var selectedAnswers = item.querySelectorAll(".answer.selected");
  
        selectedAnswers.forEach(function (selectedAnswer) {
          if (selectedAnswer.dataset.isCorrect === "true") {
            selectedAnswer.classList.add("correct");
          } else {
            selectedAnswer.classList.add("wrong");
            allCorrect = false;
          }
        });
  
        item.querySelectorAll(".answer").forEach(function (answer) {
          if (!answer.classList.contains("selected")) {
            answer.classList.add("no-click");
          }
        });
      });
  
      retryButton.style.display = "block";
      submitButton.style.display = "none";
  
      if (!allCorrect) {
        memberData.quizAttempts[quizName] = memberData.quizAttempts[quizName]
          ? memberData.quizAttempts[quizName] + 1
          : 1;
  
        let remainingAttempts = 5 - memberData.quizAttempts[quizName];
        attemptInfoBox.textContent = `Verbleibende Versuche: ${remainingAttempts}`;
        attemptInfoBox.style.backgroundColor =
          remainingAttempts > 2
            ? "blue"
            : remainingAttempts === 2
            ? "yellow"
            : "red";
  
        if (remainingAttempts <= 0) {
          memberData.blockedpruefung = {
            name: quizName,
            timestamp: new Date().toISOString(),
          };
        }
  
        await memberstack.updateMemberJSON({ json: memberData });
      }
    });
  
    retryButton.addEventListener("click", async function () {
      quizItems.forEach(function (item) {
        item.querySelectorAll(".answer").forEach(function (answer) {
          answer.classList.remove("selected", "correct", "wrong", "no-click");
        });
      });
  
      attemptInfoBox.style.display = "none";
      retryButton.style.display = "none";
      submitButton.style.display = "block";
  
      // Setze den Fragestatus zurück
      questionsAnswered.fill(false);
      // Aktualisiere den Zustand des "Prüfung absenden"-Buttons
      updateSubmitButtonState();
  
      if (memberData.quizAttempts[quizName]) {
        const lastAttemptTime = new Date(
          memberData.quizAttempts[quizName].timestamp
        );
        const currentTime = new Date();
  
        if ((currentTime - lastAttemptTime) / 3600000 >= 24) {
          memberData.quizAttempts[quizName] = 0;
          await memberstack.updateMemberJSON({ json: memberData });
        }
      }
    });
  
    // Initialisiere den Zustand des "Prüfung absenden"-Buttons
    updateSubmitButtonState();
  });
  