import { db, storage } from './firebase.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const mandals = ["भेंसोदा", "भानपुरा", "गरोठ", "मेलखेडा", "खड़ावदा", "शामगढ़", "सुवासरा", "बसाई", "सीतामऊ", "क्यामपुर", "सीतामऊ ग्रामीण", "गुर्जर बरडिया", "धुंधधड़का", "बुढा", "पिपलिया मंडी", "मल्हारगढ़", "दलोदा", "मगरामाता जी", "मंदसौर ग्रामीण", "मंदसौर उत्तर", "मंदसौर दक्षिण"];

// डोम लोड होने पर
document.addEventListener('DOMContentLoaded', () => {
    // मंडल लिस्ट को ड्रॉपडाउन में जोड़ें
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

    // कार्यक्रम के नाम और इवेंट्स लोड करें
    loadEventNames();
    loadEventsToDropdowns();
    loadEvents();
});

// कार्यक्रम के नाम लोड करें
async function loadEventNames() {
    const eventNameSelect = document.getElementById('eventName');
    const eventSelect = document.getElementById('eventSelect');
    const reportEventSelect = document.getElementById('reportEventSelect');
    const eventNameList = document.getElementById('eventNameList');
    eventNameSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    eventSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    reportEventSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    eventNameList.innerHTML = '';

    const querySnapshot = await getDocs(collection(db, "eventNames"));
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

        // डैशबोर्ड में नाम लिस्ट
        const div = document.createElement('div');
        div.innerHTML = `${eventName} <button onclick="editEventName('${doc.id}', '${eventName}')">एडिट</button>`;
        eventNameList.appendChild(div);
    });
}

// इवेंट फॉर्म सबमिशन
document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventData = {
        eventNameId: document.getElementById('eventName').value,
        mandal: document.getElementById('mandal').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('location').value
    };
    try {
        await addDoc(collection(db, "events"), eventData);
        alert("इवेंट जोड़ा गया!");
        document.getElementById('eventForm').reset();
        sendTelegramAlert(`नया इवेंट जोड़ा गया: ${eventData.eventNameId}`);
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
        mandal: document.getElementById('coordMandal').value,
        name: document.getElementById('coordName').value,
        mobile: document.getElementById('coordMobile').value,
        coCoordName1: document.getElementById('coCoordName1').value || '',
        coCoordMobile1: document.getElementById('coCoordMobile1').value || '',
        coCoordName2: document.getElementById('coCoordName2').value || '',
        coCoordMobile2: document.getElementById('coCoordMobile2').value || ''
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
            mandal: document.getElementById('reportMandal').value,
            location: document.getElementById('reportLocation').value,
            attendance: document.getElementById('attendance').value,
            guests: document.getElementById('guests').value,
            details: document.getElementById('details').value,
            photos: photoUrls
        };
        await addDoc(collection(db, `events/${eventId}/reports`), reportData);
        alert("रिपोर्ट सबमिट की गई!");
        document.getElementById('reportForm').reset();
        sendTelegramAlert(`नई रिपोर्ट सबमिट की गई: ${eventId}`);
        loadEvents();
    } catch (error) {
        console.error("Error adding report: ", error);
        alert("त्रुटि: रिपोर्ट सबमिट करने में समस्या।");
    }
});

// कार्यक्रम का नाम जोड़ें
document.getElementById('eventNameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newEventName = document.getElementById('newEventName').value;
    try {
        await addDoc(collection(db, "eventNames"), { name: newEventName });
        alert("कार्यक्रम का नाम जोड़ा गया!");
        document.getElementById('eventNameForm').reset();
        loadEventNames();
    } catch (error) {
        console.error("Error adding event name: ", error);
        alert("त्रुटि: कार्यक्रम का नाम जोड़ने में समस्या।");
    }
});

// इवेंट्स को ड्रॉपडाउन में लोड करें
async function loadEventsToDropdowns() {
    const eventSelect = document.getElementById('eventSelect');
    const reportEventSelect = document.getElementById('reportEventSelect');
    eventSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    reportEventSelect.innerHTML = '<option value="">कार्यक्रम का नाम चुनें</option>';
    const querySnapshot = await getDocs(collection(db, "events"));
    querySnapshot.forEach((doc) => {
        const event = doc.data();
        const option1 = document.createElement('option');
        const option2 = document.createElement('option');
        option1.value = option2.value = doc.id;
        option1.textContent = option2.textContent = event.eventNameId;
        eventSelect.appendChild(option1);
        reportEventSelect.appendChild(option2);
    });
}

// डैशबोर्ड में इवेंट्स लोड करें
async function loadEvents() {
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    swiperWrapper.innerHTML = '';
    const querySnapshot = await getDocs(collection(db, "events"));
    const reportedMandals = new Set();
    const allReports = [];

    // सभी रिपोर्ट्स लोड करें
    for (const eventDoc of querySnapshot.docs) {
        const reportsSnapshot = await getDocs(collection(db, `events/${eventDoc.id}/reports`));
        reportsSnapshot.forEach((reportDoc) => {
            reportedMandals.add(eventDoc.id);
            allReports.push({ eventId: eventDoc.id, ...reportDoc.data() });
        });
    }

    // इवेंट्स और उनकी स्थिति दिखाएँ
    querySnapshot.forEach(async (doc) => {
        const event = doc.data();
        const eventId = doc.id;
        const eventNameDoc = await getDoc(doc(db, "eventNames", event.eventNameId));
        const eventName = eventNameDoc.exists() ? eventNameDoc.data().name : "Unknown";
        const div = document.createElement('div');
        div.innerHTML = `
            ${eventName} - ${event.mandal} (${event.date}, ${event.time}, ${event.location}) 
            - ${reportedMandals.has(eventId) ? 'रिपोर्ट की गई' : 'रिपोर्ट बाकी'}
            <button onclick="editEvent('${eventId}')">एडिट</button>
            <button onclick="deleteEvent('${eventId}')">डिलीट</button>
        `;
        eventList.appendChild(div);
    });

    // फ़ोटो स्लाइडशो
    allReports.forEach((report) => {
        report.photos.forEach((photoUrl) => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.innerHTML = `<img src="${photoUrl}" alt="Event Photo">`;
            swiperWrapper.appendChild(slide);
        });
    });

    // Swiper स्लाइडशो इनिशियलाइज़ करें
    new Swiper('.swiper', {
        loop: true,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        slidesPerView: 1,
        spaceBetween: 10,
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

// कार्यक्रम का नाम एडिट करें
async function editEventName(eventNameId, currentName) {
    const newName = prompt("नया कार्यक्रम का नाम:", currentName);
    if (newName) {
        try {
            await updateDoc(doc(db, "eventNames", eventNameId), { name: newName });
            alert("कार्यक्रम का नाम अपडेट किया गया!");
            loadEventNames();
        } catch (error) {
            console.error("Error updating event name: ", error);
            alert("त्रुटि: कार्यक्रम का नाम अपडेट करने में समस्या।");
        }
    }
}
window.editEventName = editEventName;

// इवेंट एडिट करें
async function editEvent(eventId) {
    const eventDoc = doc(db, "events", eventId);
    const event = (await getDocs(collection(db, "events"))).docs
