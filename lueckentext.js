document.addEventListener("DOMContentLoaded", function () {
    var antworten = "Test, Lückentext".split(",");
    var infoBox = document.querySelector(".info-box");
    var versuche = 0;
    const MAX_ATTEMPTS = 5;
  
    if (!infoBox) {
      console.error("Info-Box Element wurde nicht gefunden!");
      return; // Beendet die Ausführung, wenn die Info-Box nicht existiert
    }
  
    document
      .querySelectorAll(".lueckentext")
      .forEach(function (lueckentext, index) {
        const vollstaendigerText = lueckentext.innerHTML;
        lueckentext.innerHTML = vollstaendigerText.replace(
          /\[\[(\d+)\]\]/g,
          function (match, num) {
            var antwort = antworten[num - 1];
            var inputLength = Math.max(antwort.length * 10, 30); // Mindestens 30px Breite
            return (
              '<input type="text" class="luecken-input" style="width: ' +
              inputLength +
              'px;" data-luecken-nummer="' +
              num +
              '">'
            );
          }
        );
        lueckentext.setAttribute(
          "data-antwort-" + (index + 1),
          antworten[index].trim()
        );
      });
  
    document
      .getElementById("ueberpruefungs-button")
      .addEventListener("click", function () {
        var alleRichtig = true;
        versuche++;
  
        document
          .querySelectorAll(".luecken-input")
          .forEach(function (input, index) {
            const lueckenNummer = input.getAttribute("data-luecken-nummer");
            const lueckentext = input.closest(".lueckentext");
            const korrekteAntworten = lueckentext
              .getAttribute("data-antworten")
              .split(",");
            const korrekteAntwort = korrekteAntworten[index].trim();
  
            if (
              input.value.trim().toLowerCase() === korrekteAntwort.toLowerCase()
            ) {
              input.style.borderColor = "green";
            } else {
              alleRichtig = false;
              input.style.borderColor = "red";
              const maxHilfeLaenge = Math.ceil(korrekteAntwort.length * 0.3); // Maximal 30% der Wortlänge
              const buchstabenZumAnzeigen = Math.min(versuche, maxHilfeLaenge);
              input.placeholder =
                korrekteAntwort.substring(0, buchstabenZumAnzeigen) + "...";
            }
          });
  
        if (!alleRichtig) {
          if (versuche < MAX_ATTEMPTS) {
            infoBox.querySelector("p").textContent =
              "Noch " + (MAX_ATTEMPTS - versuche) + " Versuche übrig.";
            infoBox.className =
              "remaining-time attempt-info-box info-box info-box-warning";
          } else {
            infoBox.querySelector("p").textContent =
              "Bitte wiederholen Sie die Unterlagen und versuchen Sie es morgen erneut.";
            infoBox.className =
              "remaining-time attempt-info-box info-box info-box-warning-red";
          }
        } else {
          infoBox.querySelector("p").textContent =
            "Alle Antworten sind korrekt. Gut gemacht!";
          infoBox.className =
            "remaining-time attempt-info-box info-box info-box-success";
        }
      });
  });
  