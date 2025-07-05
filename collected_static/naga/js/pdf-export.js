document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('download-pdf-btn');
    if (!btn || btn.dataset.pdfHandlerAttached === "true") return;

    //Mark that we've added this handler
    btn.dataset.pdfHandlerAttached = "true";

    btn.addEventListener('click', function() {
        const element = document.getElementById('pdf-content');
        const tabContents = element.querySelectorAll('.tabcontent');

        let initiallyVisibleTab = null;
        const originalDisplay = Array.from(tabContents).map((el, i) => {
            if (el.style.display !== 'none') {
                initiallyVisibleTab = i;
            }
            return el.style.display;
        });

        tabContents.forEach(el => el.style.display = 'block');
        element.style.display = 'block';

        // Inject temporary PDF styles
        const style = document.createElement('style');
        style.id = 'pdf-styles';
        style.innerHTML = `
      #pdf-content {
        font-family: "Georgia", "Times New Roman", serif;
        font-size: 12pt;
        line-height: 1.5;
      }
      #pdf-content .tabcontent {
        margin-bottom: 2em;
        padding-bottom: 1em;
        border-bottom: 1px dashed #ccc;
      }
      #pdf-content h1, #pdf-content h2 {
        margin-top: 1.2em;
        margin-bottom: 0.5em;
        border-bottom: 1px solid #888;
        padding-bottom: 0.2em;
        page-break-before: always;
      }
      #pdf-content h1:first-of-type {
        page-break-before: auto;
      }
      #pdf-content p,
      #pdf-content div,
      #pdf-content li {
        margin-bottom: 0.4em;
      }
    `;
        document.head.appendChild(style);

        setTimeout(() => {
            html2pdf().set({
                margin: 0.5,
                filename: 'Character_Sheet.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            }).from(element).save().then(() => {
                tabContents.forEach((el, i) => {
                    el.style.display = (i === initiallyVisibleTab) ? 'block' : 'none';
                });
                const injected = document.getElementById('pdf-styles');
                if (injected) injected.remove();
            });
        }, 100);
    });
});