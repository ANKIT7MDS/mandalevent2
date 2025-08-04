import { db, storage } from './firebase.js';
import { collection, addDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const mandals = ["भेंसोदा", "भानपुरा", "गरोठ", "मेलखेडा", "खड़ावदा", "शामगढ़", "सुवासरा", "बसाई", "सीतामऊ", "क्यामपुर", "सीतामऊ ग्रामीण", "गुर्जर बरडिया", "धुंधधड़का", "बुढा", "पिपलिया मंडी", "मल्हारगढ़", "दलोदा", "मगरामाता जी", "मंदसौर ग्रामीण", "मंदसौर उत्तर", "मंदसौर दक्षिण"];

// मंडल लिस्ट को ड्रॉपडाउन में जोड़ें
document.addEventListener('DOMContentLoaded', () => {
    const mandalSelect = document.getElementById('mandal');
    mandals.forEach(mandal => {
        const option = document.createElement('option');
        option.value = mandal;
        option.textContent = mandal;
        mandalSelect.appendChild(option);
    });

    // डीप लिंकिंग
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    if (view) showTab(view);
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
    } catch (error) {
        console.error("Error adding event: ", error);
    }
});

// संयोजक फॉर्म सबमिशन
document.getElementById('coordinatorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const coordinatorData = {
        name: document.getElementById('coordName').value,
        mobile: document.getElementById('coordMobile').value
    };
    try {
        await addDoc(collection(db, "coordinators"), coordinatorData);
        alert("संयोजक जोड़ा गया!");
        document.getElementById('coordinatorForm').reset();
    } catch (error) {
        console.error("Error adding coordinator: ", error);
    }
});

// रिपोर्ट फॉर्म सबमिशन
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const files = document.getElementById('photos').files;
    const photoUrls = [];
    for (let file of files) {
        const storageRef = ref(storage, `reports/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoUrls.push(url);
    }
    const reportData = {
        date: document.getElementById('reportDate').value,
        guests: document.getElementById('guests').value,
        attendance: document.getElementById('attendance').value,
        details: document.getElementById('details').value,
        photos: photoUrls
    };
    try {
        await addDoc(collection(db, "reports"), reportData);
        alert("रिपोर्ट सबमिट की गई!");
        document.getElementById('reportForm').reset();
        sendTelegramAlert("नई रिपोर्ट सबमिट की गई!");
    } catch (error) {
        console.error("Error adding report: ", error);
    }
});

// डैशबोर्ड में इवेंट्स लोड करें
async function loadEvents() {
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "events"));
    querySnapshot.forEach((doc) => {
        const event = doc.data();
        const div = document.createElement('div');
        div.textContent = `${event.name} - ${event.mandal} (${event.date})`;
        eventList.appendChild(div);
    });
}

// टैब स्विचिंग
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}
window.showTab = showTab;

// Telegram अलर्ट
async function sendTelegramAlert(message) {
    const botToken = "8064306737:AAFvXvc3vIT1kyccGiPbpYGCAr9dgKJcRzw";
    const chatId = "733804072";
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message
        })
    });
}

// CSV एक्सपोर्ट (बेसिक)
function exportToCSV() {
    const csv = "Event Name,Mandal,Date,Time,Location\n";
    // डेटा Firestore से लाएँ और CSV बनाएँ
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    a.click();
}
window.exportToCSV = exportToCSV;
