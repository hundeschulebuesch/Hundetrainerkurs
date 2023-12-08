document.addEventListener("DOMContentLoaded", async function () {
    const memberstack = window.$memberstackDom;

    try {
        const member = await memberstack.getCurrentMember();

        if (member && member.data) {
            let memberId = member.id;
            let memberData = await memberstack.getMemberJSON(memberId);

            // Überprüfung von lastFinishedLektion
            let lastFinishedLektion = memberData.data.lastFinishedLektion;

            // Logik für die Anzeige der Lektionen und Buttons
            const lektionElements = document.querySelectorAll('[data-lektionsname]');
            const startButtons = document.querySelectorAll('.start-lektion-button');
            const resumeButtons = document.querySelectorAll('.resume-lektion-button');

            lektionElements.forEach((el, index) => {
                const lektionsname = el.getAttribute('data-lektionsname');
                const isCompleted = memberData.data.lektionen.includes(lektionsname);
                const abhaengigkeit = el.getAttribute('data-abhaengigkeit');
                const isDisabled = abhaengigkeit && !isCompleted;

                // Wenn die Lektion noch nicht abgeschlossen ist und Abhängigkeiten vorhanden sind,
                // deaktivieren wir den Link
                if (isDisabled) {
                    el.classList.add('disabled');
                    el.removeAttribute('href');

                     const warningMessage = document.createElement('div');
                    warningMessage.className = 'custom-warning-overlay';
                    warningMessage.style.cssText = "position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(253, 242, 225, 0.8); display: flex; align-items: center; justify-content: center; border-radius: 12px; font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 0.75rem; line-height: 1.5; text-align: center; padding: 10px;";
                    el.style.position = 'relative';
                    el.appendChild(warningMessage);
                    warningMessage.innerHTML = '<p>Bitte schließen Sie zuerst die vorherigen Lektionen ab.</p>';
                }   else {
                    // Wenn die Lektion abgeschlossen ist, prüfen wir, ob wir den "Starten"-Button anzeigen müssen
                    if (index === 0 && !memberData.data.currentLektion) {
                        // Zeige den "Starten"-Button bei der ersten Lektion an, wenn keine aktuelle Lektion gesetzt ist
                        startButtons[index].style.display = 'block';
                    } else if (index > 0 && memberData.data.lektionen.includes(lastFinishedLektion)) {
                        // Zeige den "Starten"-Button bei der nächsten Lektion an, wenn die letzte abgeschlossene Lektion vorhanden ist
                        startButtons[index].style.display = 'block';
                    }

                    // Wenn die aktuelle Lektion mit dieser Lektion übereinstimmt, zeige den "Lektion fortsetzen"-Button
                    if (memberData.data.currentLektion === lektionsname) {
                        resumeButtons[index].style.display = 'block';
                    }
                }
            });
        } else {
            console.log('Benutzer nicht eingeloggt oder kein Mitglied');
        }
    } catch (error) {
        console.error('Fehler beim Abrufen oder Aktualisieren des Mitglieds: ', error);
    }
});