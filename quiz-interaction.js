<script>
document.addEventListener("DOMContentLoaded", function() {
  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  var quizItems = document.querySelectorAll('.quiz-grid');
  var submitButton = document.querySelector('.quiz-submit-button');
  var retryButton = document.querySelector('.quiz-retry-button');

  quizItems.forEach(function(item) {
    var answersText = item.querySelector('.hidden-rich-text').innerHTML;
    var correctAnswers = item.querySelector('.right-answers-hidden-text').textContent.trim().split(',');

    // Antworten in ein Array umwandeln und mischen
    var answers = answersText.split('</p><p>');
    answers = answers.map(function(answer) { return answer.replace('<p>', '').replace('</p>', ''); });
    shuffleArray(answers);

    var answersDiv = document.createElement('div');
    answersDiv.className = 'interactive-answers';

    answers.forEach(function(answer, index) {
      if (answer.trim() !== '') { // Ignoriere leere Antworten
        var answerDiv = document.createElement('div');
        answerDiv.className = 'answer';
        answerDiv.innerHTML = answer;
        answerDiv.dataset.index = String.fromCharCode(97 + index);
        answerDiv.addEventListener('click', function() {
          this.classList.toggle('selected');
        });
        answersDiv.appendChild(answerDiv);
      }
    });

    item.querySelector('.answers-box').appendChild(answersDiv);
  });

  submitButton.addEventListener('click', function(event) {
    event.preventDefault();
    var allAnswered = true;

    quizItems.forEach(function(item) {
      var selectedAnswers = item.querySelectorAll('.answer.selected');
      if (selectedAnswers.length === 0) {
        allAnswered = false;
      }
    });

    if (allAnswered) {
      quizItems.forEach(function(item) {
        var correctAnswers = item.querySelector('.right-answers-hidden-text').textContent.trim().split(',');
        var selectedAnswers = item.querySelectorAll('.answer.selected');

        selectedAnswers.forEach(function(selectedAnswer) {
          var selectedIndex = selectedAnswer.dataset.index.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, ...
          if (correctAnswers.includes(selectedAnswer.dataset.index)) {
            selectedAnswer.classList.add('correct');
          } else {
            selectedAnswer.classList.add('wrong');
          }
        });

        var answers = item.querySelectorAll('.answer');
        answers.forEach(function(answer) {
          answer.classList.add('no-click');
        });
      });

      retryButton.style.display = 'block';
      submitButton.style.display = 'none';
    } else {
      alert('Please answer all questions before submitting.');
    }
  });

  retryButton.addEventListener('click', function() {
    quizItems.forEach(function(item) {
      var answers = item.querySelectorAll('.answer');
      answers.forEach(function(answer) {
        answer.classList.remove('selected', 'correct', 'wrong', 'no-click');
      });
    });

    retryButton.style.display = 'none';
    submitButton.style.display = 'block';
  });
});
</script>

<style>
/* Basisstil für alle Antworten */
.answer {
    transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
    box-shadow: none;
    background-image: none;
    line-height: 1.5;
    font-family: 'Outfit', sans-serif;
    font-size: 0.825 rem;
    font-weight: 500;
    display: flex;
    padding: 4px 16px;
    align-items: center;
    border-radius: 12px;
    margin-top: 16px;
    margin-bottom: 16px;
    font-size: 1rem;
    cursor: pointer;
    border: 2px solid transparent; /* Transparent border for the basic style */
}

/* Style for pre-selected answers before submitting */
.answer.selected {
    background-color: rgb(227, 237, 249); /* Blue background for selected answers */
    border: 2px solid rgb(197, 219, 244); /* Blue border for selected answers */
    color: rgb(19, 90, 169); /* Blue text for selected answers */
}

/* Style for correct answers after submitting */
.answer.correct {
    background-color: rgb(223, 247, 236); /* Green background for correct answers */
    border: 2px solid rgb(178, 236, 214); /* Green border for correct answers */
    color: rgb(30, 130, 76); /* Green text for correct answers */
}

/* Style for wrong answers after submitting */
.answer.wrong {
    background-color: rgb(255, 205, 210); /* Red background for wrong answers */
    border: 2px solid rgb(244, 67, 54); /* Red border for wrong answers */
    color: rgb(244, 67, 54); /* Red text for wrong answers */
}

/* Prevents clicking after submitting */
.no-click {
    pointer-events: none;
}

/* Hover effect for selectable answers before submitting */
.answer:hover {
    background-color: #ebf5ff; /* Light blue background for hover effect */
    border-color: #bacfe0; /* Light blue border for hover effect */
}

/* Stil für den "Erneut versuchen"-Button */
.quiz-retry-button {
  background-color: rgb(255, 243, 205); /* Gelber Hintergrund */
  color: rgb(193, 120, 8); /* Gelber Text */
  /* Weitere Stil-Definitionen... */
}

/* Versteckter Stil für den Button, der standardmäßig nicht sichtbar ist */
.quiz-retry-button {
  display: none;
}
</style>

<script>
document.addEventListener("DOMContentLoaded", async function() {
  const memberstack = window.$memberstackDom;
  const lektionsName = document.querySelector('[data-lektions-name]').getAttribute('data-lektions-name'); // Annahme: Jede Lektionsseite hat ein eindeutiges data-lektions-name Attribut

  try {
    const member = await memberstack.getMemberJSON();

    if (member && member.data) {
      if (!member.data) {
        member.data = {};
      }

      member.data.currentLektion = lektionsName; // Aktualisieren der aktuellen Lektion

      await memberstack.updateMemberJSON({ json: member.data });
      console.log(`Lektion ${lektionsName} wurde als aktuell markiert`);
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der aktuellen Lektion: ', error);
  }
});

</script>


<!-- Dieses Skript prüft, ob eine Prüfung auf der letzten Seiten vorhanden und 
bestanden ist und zeigt dementsprechend die Feedback und Lektion Abschließen buttons an.
Auch das Abschließen von Lektionen wird hier behandelt -->
<script>
document.addEventListener("DOMContentLoaded", async function() {
  const isLastSite = document.querySelector('[attribute=".is-last-site"]');
  if (!isLastSite) {
    return; // Nicht die letzte Seite, also beenden wir das Skript hier
  }

  const lektionAbschließenDiv = document.querySelector('.lektion-abschlie-en');
  const feedbackButton = lektionAbschließenDiv.querySelector('.feedback-button');
  const abschließenButton = lektionAbschließenDiv.querySelector('.link-block-5');
  const prüfungsAttribut = document.querySelector('[data-pruefung]').getAttribute('data-pruefung');
  const lektionsName = document.querySelector('[data-lektions-name]').getAttribute('data-lektions-name');

  async function checkIfPrüfungCompleted() {
    if (prüfungsAttribut === "") {
      return true;
    }

    const memberstack = window.$memberstackDom;
    const prüfungsName = prüfungsAttribut;

    try {
      const member = await memberstack.getMemberJSON();

      if (member && member.data && member.data.pruefungen) {
        return member.data.pruefungen.includes(prüfungsName);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Prüfungsdaten: ', error);
    }

    return false;
  }

  const prüfungCompleted = await checkIfPrüfungCompleted();
  if (prüfungCompleted) {
    feedbackButton.style.display = 'block';
    abschließenButton.style.display = 'block';
  } else {
    feedbackButton.style.display = 'none';
    abschließenButton.style.display = 'none';
  }

  abschließenButton.addEventListener('click', async function(event) {
    event.preventDefault();
    const memberstack = window.$memberstackDom;

    try {
      const member = await memberstack.getMemberJSON();

      if (!member.data.lektionen) {
        member.data.lektionen = [];
      }

      if (!member.data.lektionen.includes(lektionsName)) {
        member.data.lektionen.push(lektionsName);
      }

      await memberstack.updateMemberJSON({ json: member.data });
      console.log(`Lektion ${lektionsName} wurde als abgeschlossen markiert`);

      // Abschließen Button ausblenden und durch "Nächste Lektion Starten" Button ersetzen
      abschließenButton.style.display = 'none';
      const nächsteLektionButton = document.createElement('a');
      nächsteLektionButton.textContent = 'Nächste Lektion starten';
      nächsteLektionButton.href = 'lektionen/{{wf {&quot;path&quot;:&quot;nachste-lektion:name&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}'; // Setze hier den Link zur nächsten Lektion
      nächsteLektionButton.className = 'link-block-5 w-inline-block';
      lektionAbschließenDiv.appendChild(nächsteLektionButton);

    } catch (error) {
      console.error('Fehler beim Markieren der Lektion als abgeschlossen: ', error);
    }
  });
});

</script>