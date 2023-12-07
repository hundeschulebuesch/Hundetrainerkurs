document.addEventListener("DOMContentLoaded", async function() {
    const memberstack = window.$memberstackDom;
  
    try {
      const member = await memberstack.getCurrentMember();
  
      if (member && member.data) {
        let memberId = member.id;
        let memberData = await memberstack.getMemberJSON(memberId);
  
        // Check and update 'lektionen' if not present
        if (!memberData.data.lektionen) {
          memberData.data.lektionen = [];
          await memberstack.updateMemberJSON({ json: memberData.data });
          console.log('Lektionsdaten wurden aktualisiert');
        }
  
        // Check and update 'currentLektion' if not present
        if (!memberData.data.currentLektion) {
          memberData.data.currentLektion = "";
          await memberstack.updateMemberJSON({ json: memberData.data });
          console.log('Aktuelle Lektion wurde aktualisiert');
        }
  
      // Logik für die Anzeige der Lektionen und Buttons
        const lektionElements = document.querySelectorAll('[data-abhaengigkeit]');
        lektionElements.forEach(el => {
          const abhaengigkeit = el.getAttribute('data-abhaengigkeit');
          const isCompleted = memberData.data.lektionen.includes(abhaengigkeit);
  
          if (abhaengigkeit && !isCompleted) {
            // Wenn die Lektion noch nicht abgeschlossen ist, deaktivieren wir den Link
            el.classList.add('disabled');
  
            // Entfernen oder deaktivieren des href-Attributs
            if (el.tagName === 'A') {
              el.removeAttribute('href');
            }
  
            const warningMessage = document.createElement('div');
            warningMessage.className = 'custom-warning-overlay';
            warningMessage.style.cssText = "position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(253, 242, 225, 0.8); display: flex; align-items: center; justify-content: center; border-radius: 12px; font-family: 'Outfit', sans-serif; font-weight: 500; font-size: 0.75rem; line-height: 1.5; text-align: center; padding: 10px;";
            warningMessage.innerHTML = '<p>Bitte schließen Sie zuerst die vorherigen Lektionen ab.</p>';
            el.style.position = 'relative';
            el.appendChild(warningMessage);
          }
        });
  
        // Logik für die Anzeige der Buttons
        const startButtons = document.querySelectorAll('.start-lektion-button');
        const resumeButtons = document.querySelectorAll('.resume-lektion-button');
        startButtons.forEach(btn => btn.style.display = 'none');
        resumeButtons.forEach(btn => btn.style.display = 'none');
  
        const currentLektionIndex = lektionElements.findIndex(el => el.getAttribute('data-abhaengigkeit') === memberData.data.currentLektion);
        if (currentLektionIndex >= 0) {
          if (currentLektionIndex === 0 || !memberData.data.lektionen.includes(memberData.data.currentLektion)) {
            // Der Start-Button wird angezeigt, wenn es die erste Lektion ist oder die aktuelle Lektion nicht in den abgeschlossenen Lektionen ist
            startButtons[currentLektionIndex].style.display = 'block';
          } else if (currentLektionIndex + 1 < startButtons.length) {
            // Der Resume-Button wird angezeigt, wenn die aktuelle Lektion nicht die letzte ist
            resumeButtons[currentLektionIndex + 1].style.display = 'block';
          }
        }
      } else {
        console.log('Benutzer nicht eingeloggt oder kein Mitglied');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen oder Aktualisieren des Mitglieds: ', error);
    }
  });