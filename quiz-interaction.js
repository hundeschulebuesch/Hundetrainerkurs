document.addEventListener("DOMContentLoaded", async function() {
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
    var prüfungsName = document.querySelector('[data-prüfungs-name]').getAttribute('data-prüfungs-name');

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

    submitButton.addEventListener('click', async function(event) {
        event.preventDefault();
        var allAnswered = true;
        var allCorrect = true;
    
        quizItems.forEach(function(item) {
            var selectedAnswers = item.querySelectorAll('.answer.selected');
            var correctAnswers = item.querySelector('.right-answers-hidden-text').textContent.trim().split(',');
    
            if (selectedAnswers.length === 0) {
                allAnswered = false;
            }
    
            selectedAnswers.forEach(function(selectedAnswer) {
                if (!correctAnswers.includes(selectedAnswer.dataset.index)) {
                    allCorrect = false;
                    selectedAnswer.classList.add('wrong');
                } else {
                    selectedAnswer.classList.add('correct');
                }
            });
        });
    
        if (allAnswered && allCorrect) {
            // Markiere korrekte Antworten und friere sie ein
            quizItems.forEach(function(item) {
                var answers = item.querySelectorAll('.answer');
                answers.forEach(function(answer) {
                    answer.classList.add('no-click');
                    if (correctAnswers.includes(answer.dataset.index)) {
                        answer.classList.add('correct');
                    }
                });
            });

            // Prüfung als abgeschlossen in Memberstack speichern
            const memberstack = window.$memberstackDom;
            try {
                const member = await memberstack.getMemberJSON();

                if (!member.data.pruefungen) {
                    member.data.pruefungen = [];
                }

                if (!member.data.pruefungen.includes(prüfungsName)) {
                    member.data.pruefungen.push(prüfungsName);
                    await memberstack.updateMemberJSON({ json: member.data });
                    console.log(`Prüfung ${pruefungsName} wurde als abgeschlossen markiert`);
                }

                // Ersetze den Submit-Button durch eine Benachrichtigung
                submitButton.style.display = 'none';
                const quizCompletedText = document.createElement('div');
                quizCompletedText.textContent = 'Dieses Quiz wurde bereits erfolgreich abgeschlossen.';
                quizItems[0].parentNode.insertBefore(quizCompletedText, quizItems[0]);
            } catch (error) {
                console.error('Fehler beim Speichern der Prüfungsdaten: ', error);
            }

            retryButton.style.display = 'none';

        } else if (allAnswered) {
            alert('Some answers are incorrect. Please try again.');
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
