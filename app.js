import { db, storage } from './firebase.js';
import { collection, addDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const mandals = ["भेंसोदा", "भानपुरा", "गरोठ", "मेलखेडा", "खड़ावदा", "शामगढ़", "सुवासरा", "बसाई", "सीतामऊ", "क्यामपुर", "सीतामऊ ग्रामीण", "गुर्जर बरडिया", "धुंधधड़का", "बुढा", "पिपलिया मंडी", "मल्हारगढ़", "दलोदा", "मगरामाता जी", "मंदसौर ग्रामीण", "मंदसौर उत्तर", "मंदसौर दक्षिण"];

// डोम लोड होने पर
document.addEventListener('DOMContentLoaded', () => {
    // मंडल लिस्ट को ड्रॉपडाउन में जोड़ें
    const mandalSelect = document.getElementById('mandal');
    mandals.forEach(mandal => {
        const option = document.createElement('option');
        option.value = mandal;
        option.textContent = mandal;
        mandalSelect.appendChild(option);
    });

    // इवेंट्स को संयोजक और रिपोर्ट फॉर्म में जोड़ें
    loadEventsToDropdowns();

    // डीप लिंकिंग
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') || 'event';
    showTab(view);

    // डैशबोर्ड लोड करें
    loadEvents();
});

// इवेंट फॉर्म सबमिशन
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventData = {
        name: document.getElementById('eventName').value,
        mandal: document.getElementById('mandal').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('location').value
    };
    try {
        await addDoc(collection(db, "events"), eventData);
        alert("इवेंट जोड़ा गया!");
        document.getElementById('eventForm').reset();
        sendTelegramAlert(`नया इवेंट जोड़ा गया: ${eventData.name}`);
        loadEventsToDropdowns();
        loadEvents();
    } catch (error) {
        console.error("Error adding event: ", error);
        alert("त्रुटि: इवेंट जोड़ने में समस्या।");
    }
});

// संयोजक फॉर्म सबमिशन
document.getElementById('coordinatorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const coordinatorData = {
        eventId: document.getElementById('eventSelect').value,
        name: document.getElementById('coordName').value,
        mobile: document.getElementById('coordMobile').value
    };
    try {
        await addDoc(collection(db, `events/${coordinatorData.eventId}/coordinators`), coordinatorData);
        alert("संयोजक जोड़ा गया!");
        document.getElementById('coordinatorForm').reset();
    } catch (error) {
        console.error("Error adding coordinator: ", error);
        alert("त्रुटि: संयोजक जोड़ने में समस्या।");
    }
});

// रिपोर्ट फॉर्म सबमिशन
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventId = document.getElementById('reportEventSelect').value;
    const files = document.getElementById('photos').files;
    if (files.length > 10) {
        alert("अधिकतम 10 फ़ोटो अपलोड करें!");
        return;
    }
    const photoUrls = [];
    try {
        for (let file of files) {
            const storageRef = ref(storage, `reports/${eventId}/${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            photoUrls.push(url);
        }
        const reportData = {
            eventId: eventId,
            date: document.getElementById('reportDate').value,
            guests: document.getElementById('guests').value,
            attendance: document.getElementById('attendance').value,
            details: document.getElementById('details').value,
            photos: photoUrls
        };
        await addDoc(collection(db, `events/${eventId}/reports`), reportData);
        alert("रिपोर्ट सबमिट की गई!");
        document.getElementById('reportForm').reset();
        sendTelegramAlert(`नई रिपोर्ट सबमिट की गई: ${reportData.eventId}`);
        loadEvents();
    } catch (error) {
        console.error("Error adding report: ", error);
        alert("त्रुटि: रिपोर्ट सबमिट करने में समस्या।");
    }
});

// इवेंट्स को ड्रॉपडाउन में लोड करें
async function loadEventsToDropdowns() {
    const eventSelect = document.getElementById('eventSelect');
    const reportEventSelect = document.getElementById('reportEventSelect');
    eventSelect.innerHTML = '<option value="">इवेंट चुनें</option>';
    reportEventSelect.innerHTML = '<option value="">इवेंट चुनें</option>';
    const querySnapshot = await getDocs(collection(db, "events"));
    querySnapshot.forEach((doc) => {
        const event = doc.data();
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        option1.value = doc.id;
        option1.textContent = event.name;
        option2.value = doc.id;
        option2.textContent = event.name;
        eventSelect.appendChild(option1);
        reportEventSelect.appendChild(option2);
    });
}

// डैशबोर्ड में इवेंट्स लोड करें
async function loadEvents() {
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "events"));
    const reportedMandals = new Set();
    const reportsSnapshot = await getDocs(collection(db, "reports"));
    reportsSnapshot.forEach((doc) => {
        const report = doc.data();
        reportedMandals.add(report.eventId);
    });
    querySnapshot.forEach((doc) => {
        const event = doc.data();
        const div = document.createElement('div');
        div.textContent = `${event.name} - ${event.mandal} (${event.date}) - ${reportedMandals.has(doc.id) ? 'रिपोर्ट की गई' : 'रिपोर्ट बाकी'}`;
        eventList.appendChild(div);
    });
    // गैर-रिपोर्टिंग मंडलों को अलर्ट भेजें
    const nonReported = mandals.filter(mandal => !Array.from(reportedMandals).some(id => {
        const event = querySnapshot.docs.find(doc => doc.id === id);
        return event && event.data().mandal === mandal;
    }));
    if (nonReported.length > 0) {
        sendTelegramAlert(`रिपोर्ट बाकी मंडल: ${nonReported.join(', ')}`);
    }
}

// टैब स्विचिंग
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const tabElement = document.getElementById(tabId);
    if (tabElement) {
        tabElement.classList.add('active');
    } else {
        console.error(`Tab ${tabId} not found`);
    }
}
window.showTab = showTab;

// Telegram अलर्ट
async function sendTelegramAlert(message) {
    const botToken = "8064306737:AAFvXvc3vIT1kyccGiPbpYGCAr9dgKJcRzw";
    const chatId = "733804072";
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message
            })
        });
    } catch (error) {
        console.error("Error sending Telegram alert: ", error);
    }
}

// CSV एक्सपोर्ट
async function exportToCSV() {
    let csv = "Event Name,Mandal,Date,Time,Location\n";
    const querySnapshot = await getDocs(collection(db, "events"));
    querySnapshot.forEach((doc) => {
        const event = doc.data();
        csv += `${event.name},${event.mandal},${event.date},${event.time},${event.location}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}
window.exportToCSV = exportToCSV;
