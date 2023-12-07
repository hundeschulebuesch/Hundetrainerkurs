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