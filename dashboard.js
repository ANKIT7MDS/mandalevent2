// Export Dropdown open/close
document.getElementById('exportMenuBtn').onclick = function(e){
    e.stopPropagation();
    document.getElementById('exportMenu').style.display =
        document.getElementById('exportMenu').style.display === 'block' ? 'none' : 'block';
};
window.onclick = function(e){
    if (!e.target.matches('#exportMenuBtn')) {
        document.getElementById('exportMenu').style.display = 'none';
    }
};

// ------- Pagination Variables ------
let eventsPage = 1, PAGE_SIZE = 10, allEventsData = [];
// ... ऐसे ही coordinatorsPage, allCoordinatorsData etc.

// Firebase import/init (Type="module" में हो तो ये भी dashboard.js में)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = { /* आपकी config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -------- Event Pagination -------
async function loadEvents() {
    // ...Firebase से लाओ (फिल्टर apply), फिर:
    allEventsData = []; // fetch करके भरना है!
    // Example: allEventsData = [{...}, {...}]
    showEventsPage(1);
}
function showEventsPage(page) {
    eventsPage = page;
    const start = (page-1)*PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const visibleRows = allEventsData.slice(0, end); // Progressive Show More
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';
    visibleRows.forEach(event => {
        // ...row.innerHTML
        eventList.appendChild(row);
    });
    document.getElementById('eventShowMore').style.display =
        allEventsData.length > end ? 'block' : 'none';
}
window.showMoreEvents = function() { showEventsPage(eventsPage+1); }

// ------ बाकी tables के लिए भी यही पैटर्न -------

// ---------- Export Functions (PDF/Excel/CSV) ------------
// ... पहले जैसा code, सिर्फ function call ड्रॉपडाउन के बटन से हो!

// Hindi+Photo PDF export
window.exportReportsHindiPDF = async function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({orientation:'landscape', unit:'pt', format:'a4'});
    if (!doc.getFontList()["NotoSansDevanagari"]) {
        doc.addFileToVFS("NotoSansDevanagari-Regular.ttf", fontBase64);
        doc.addFont("NotoSansDevanagari-Regular.ttf", "NotoSansDevanagari", "normal");
    }
    doc.setFont("NotoSansDevanagari");
    doc.setFontSize(15);
    doc.text("रिपोर्ट सूची (फोटो सहित)", 40, 40, {lang: "hi"});
    // ...rest (autotable, फोटो addImage, etc.)
    doc.save("reports_hindi_photo.pdf");
};

// ---- बाकी: loadAll(), filters, delete, edit etc. ----

// ----------- INITIAL LOAD -----------
window.onload = function() {
    loadEvents();
    // ...बाकी tables भी!
};
