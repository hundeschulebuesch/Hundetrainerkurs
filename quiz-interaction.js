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
        var correctAnswersText = item.querySelector('.right-answers-hidden-text').textContent.trim();
        var correctAnswers = correctAnswersText.split(',');

        var answers = answersText.split('</p><p>');
        answers = answers.map(function(answer) {
            return answer.replace('<p>', '').replace('</p>', '').trim();
        });
        shuffleArray(answers);

        var answersDiv = document.createElement('div');
        answersDiv.className = 'interactive-answers';

        answers.forEach(function(answer, index) {
            if (answer) {
                var answerDiv = document.createElement('div');
                answerDiv.className = 'answer';
                answerDiv.innerHTML = answer;
                answerDiv.dataset.index = String.fromCharCode(97 + index); // 'a', 'b', 'c', ...
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

            var correctAnswers = item.querySelector('.right-answers-hidden-text').textContent.trim().split(',');

            item.querySelectorAll('.answer').forEach(function(answer) {
                if (selectedAnswers.length > 0) {
                    if (correctAnswers.includes(answer.dataset.index)) {
                        if (answer.classList.contains('selected')) {
                            answer.classList.add('correct');
                        } else {
                            answer.classList.add('wrong');
                        }
                    } else {
                        if (answer.classList.contains('selected')) {
                            answer.classList.add('wrong');
                        }
                    }
                }
                answer.classList.add('no-click');
            });
        });

        if (!allAnswered) {
            alert('Please answer all questions before submitting.');
        } else {
            retryButton.style.display = 'block';
            submitButton.style.display = 'none';
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
