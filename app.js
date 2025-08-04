import { db, storage } from './firebase.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const mandals = ["भेंसोदा", "भानपुरा", "गरोठ", "मेलखेडा", "खड़ावदा", "शामगढ़", "सुवासरा", "बसाई", "सीतामऊ", "क्यामपुर", "सीतामऊ ग्रामीण", "गुर्जर बरडिया", "धुंधधड़का", "बुढा", "पिपलिया मंडी", "मल्हारगढ़", "दलोदा", "मगरामाता जी", "मंदसौर ग्रामीण", "मंदसौर उत्तर", "मंदसौर दक्षिण"];

// डोम लोड होने पर
document.addEventListener('DOMContentLoaded', () => {
    const mandalSelect = document.getElementById('mandal');
    const coordMandalSelect = document.getElementById('coordMandal');
    const reportMandalSelect = document.getElementById('reportMandal');
    mandals.forEach(mandal => {
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        const option3 = document.createElement('option');
        option1.value = option2.value = option3.value = mandal;
        option1.textContent = option2.textContent = option3.textContent = mandal;
        mandalSelect.appendChild(option1);
        coordMandalSelect.appendChild(option2);
        reportMandalSelect.appendChild(option3);
    });

    loadEventNames();
    loadEvents();

    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') || 'event';
    showTab(view); // केवल चुने गए टैब को लोड करें
    window.history.replaceState(null, null, `?view=${view}`);
});

function showTab(tabId) {
    try {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
            button.disabled = false;
            button.style.cursor = 'pointer';
            button.style.opacity = '1';
            if (button.getAttribute('onclick') !== `showTab('${tabId}')`) {
                button.disabled = true;
                button.style.cursor = 'not-allowed';
                button.style.opacity = '0.5';
            }
        });

        const tabElement = document.getElementById(tabId);
        const tabButton = document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`);
        if (tabElement && tabButton) {
            tabElement.classList.add('active');
            tabButton.classList.add('active');
            window.history.replaceState(null, null, `?view=${tabId}`);
        } else {
            console.error(`Tab with ID ${tabId} not found, defaulting to 'event'`);
            const defaultTab = document.getElementById('event');
            const defaultButton = document.querySelector('.tab-button[onclick="showTab(\'event\')"]');
            if (defaultTab && defaultButton) {
                defaultTab.classList.add('active');
                defaultButton.classList.add('active');
                window.history.replaceState(null, null, '?view=event');
            }
        }
    } catch (error) {
        console.error("Error in showTab: ", error);
    }
}
window.showTab = showTab;

async function loadEventNames() {
    const eventNameSelect = document.getElementById('eventName');
    const eventSelect = document.getElementById('eventSelect');
    const reportEventSelect = document.getElementById('reportEventSelect');
    const eventNameList = document.getElementById('eventNameList');
    eventNameSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    eventSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    reportEventSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    eventNameList.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, "eventNames"));
        if (querySnapshot.empty) console.warn("No event names found");
        querySnapshot.forEach((doc) => {
            const eventName = doc.data().name;
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');
            const option3 = document.createElement('option');
            option1.value = option2.value = option3.value = doc.id;
            option1.textContent = option2.textContent = option3.textContent = eventName;
            eventNameSelect.appendChild(option1);
            eventSelect.appendChild(option2);
            reportEventSelect.appendChild(option3);
            const div = document.createElement('div');
            div.innerHTML = `${eventName} <button onclick="editEventName('${doc.id}', '${eventName}')">एडिट</button>
