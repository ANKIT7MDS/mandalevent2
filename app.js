import { db, storage } from './firebase.js'; // अगर firebase.js अलग है, तो इसे हटा दें और index.html में कॉन्फिग का उपयोग करें
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
export { showTab };
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
            div.innerHTML = `${eventName} <button onclick="editEventName('${doc.id}', '${eventName}')">एडिट</button>`;
            eventNameList.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading event names: ", error);
        alert("त्रुटि: कार्यक्रम के नाम लोड करने में समस्या।");
    }
}
export { loadEventNames };

document.getElementById('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventNameId = document.getElementById('eventName').value;
    if (!eventNameId) {
        alert("कृपया कार्यक्रम का नाम चुनें!");
        return;
    }
    const eventData = {
        eventNameId: eventNameId,
        mandal: document.getElementById('mandal').value || 'Unknown',
        date: document.getElementById('eventDate').value || new Date().toISOString().split('T')[0],
        time: document.getElementById('eventTime').value || '00:00',
        location: document.getElementById('location').value || 'Unknown'
    };
    try {
        const docRef = await addDoc(collection(db, "events"), eventData);
        console.log("Event added with ID: ", docRef.id);
        alert("कार्यक्रम जोड़ा गया!");
        document.getElementById('eventForm').reset();
        sendTelegramAlert(`नया कार्यक्रम जोड़ा गया: ${eventNameId}`);
        loadEvents();
    } catch (error) {
        console.error("Error adding event: ", error);
        alert("त्रुटि: कार्यक्रम जोड़ने में समस्या: " + error.message);
    }
});

document.getElementById('coordinatorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventNameId = document.getElementById('eventSelect').value;
    if (!eventNameId) {
        alert("कृपया कार्यक्रम का नाम चुनें!");
        return;
    }
    const coordinatorData = {
        eventNameId: eventNameId,
        mandal: document.getElementById('coordMandal').value || 'Unknown',
        name: document.getElementById('coordName').value || 'Unknown',
        mobile: document.getElementById('coordMobile').value || 'N/A',
        coCoordName1: document.getElementById('coCoordName1').value || '',
        coCoordMobile1: document.getElementById('coCoordMobile1').value || '',
        coCoordName2: document.getElementById('coCoordName2').value || '',
        coCoordMobile2: document.getElementById('coCoordMobile2').value || ''
    };
    try {
        const docRef = await addDoc(collection(db, `eventNames/${eventNameId}/coordinators`), coordinatorData);
        console.log("Coordinator added with ID: ", docRef.id);
        alert("संयोजक जोड़ा गया!");
        document.getElementById('coordinatorForm').reset();
        sendTelegramAlert(`नया संयोजक जोड़ा गया: ${eventNameId}`);
        loadEvents();
    } catch (error) {
        console.error("Error adding coordinator: ", error);
        alert("त्रुटि: संयोजक जोड़ने में समस्या: " + error.message);
    }
});

document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventNameId = document.getElementById('reportEventSelect').value;
    if (!eventNameId) {
        alert("कृपया कार्यक्रम का नाम चुनें!");
        return;
    }
    const files = document.getElementById('photos').files;
    if (files.length > 10) {
        alert("अधिकतम 10 फ़ोटो अपलोड करें!");
        return;
    }
    const photoUrls = [];
    console.log("Uploading files for eventNameId:", eventNameId);
    try {
        for (let file of files) {
            const storageRef = ref(storage, `reports/${eventNameId}/${file.name}`);
            console.log("Uploading file:", file.name);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            photoUrls.push(url);
            console.log("File uploaded, URL:", url);
        }
        const reportData = {
            eventNameId: eventNameId,
            mandal: document.getElementById('reportMandal').value || 'Unknown',
            location: document.getElementById('reportLocation').value || 'Unknown',
            attendance: document.getElementById('attendance').value || 0,
            guests: document.getElementById('guests').value || 'N/A',
            details: document.getElementById('details').value || '',
            photos: photoUrls
        };
        const docRef = await addDoc(collection(db, `eventNames/${eventNameId}/reports`), reportData);
        console.log("Report added with ID: ", docRef.id);
        alert("रिपोर्ट सबमिट की गई!");
        document.getElementById('reportForm').reset();
        sendTelegramAlert(`नई रिपोर्ट सबमिट की गई: ${eventNameId}`);
        loadEvents();
    } catch (error) {
        console.error("Error adding report: ", error);
        alert("त्रुटि: रिपोर्ट सबमिट करने में समस्या: " + error.message);
    }
});

document.getElementById('eventNameForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newEventName = document.getElementById('newEventName').value;
    if (!newEventName) {
        alert("कृपया कार्यक्रम का नाम दर्ज करें!");
        return;
    }
    try {
        const docRef = await addDoc(collection(db, "eventNames"), { name: newEventName });
        console.log("Event name added with ID: ", docRef.id);
        alert("कार्यक्रम का नाम जोड़ा गया!");
        document.getElementById('eventNameForm').reset();
        loadEventNames();
    } catch (error) {
        console.error("Error adding event name: ", error);
        alert("त्रुटि: कार्यक्रम का नाम जोड़ने में समस्या: " + error.message);
    }
});

async function loadEvents() {
    console.log("Loading events...");
    const eventList = document.getElementById('eventList');
    const coordinatorList = document.getElementById('coordinatorList');
    const reportList = document.getElementById('reportList');
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    eventList.innerHTML = '';
    coordinatorList.innerHTML = '';
    reportList.innerHTML = '';
    swiperWrapper.innerHTML = '';

    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') || 'event';

    try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const reportedMandals = new Set();
        const eventNamesSnapshot = await getDocs(collection(db, "eventNames"));

        const allCoordinators = [];
        const allReports = [];
        for (const eventNameDoc of eventNamesSnapshot.docs) {
            const coordinatorsSnapshot = await getDocs(collection(db, `eventNames/${eventNameDoc.id}/coordinators`));
            coordinatorsSnapshot.forEach((coordDoc) => allCoordinators.push({ eventNameId: eventNameDoc.id, ...coordDoc.data(), id: coordDoc.id }));
            const reportsSnapshot = await getDocs(collection(db, `eventNames/${eventNameDoc.id}/reports`));
            reportsSnapshot.forEach((reportDoc) => {
                reportedMandals.add(eventNameDoc.id);
                allReports.push({ eventNameId: eventNameDoc.id, ...reportDoc.data(), id: reportDoc.id });
            });
        }

        if (view === 'event') {
            for (const docSnap of querySnapshot.docs) {
                const event = docSnap.data();
                const eventId = docSnap.id;
                console.log("Processing event:", event);
                if (!event.eventNameId) {
                    console.warn("Event missing eventNameId:", eventId);
                    continue;
                }
                const eventNameDoc = await getDoc(doc(db, "eventNames", event.eventNameId));
                const eventName = eventNameDoc.exists() ? eventNameDoc.data().name : "Unknown";
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${eventName}</td>
                    <td>${event.mandal || '-'}</td>
                    <td>${event.date || '-'}</td>
                    <td>${event.time || '-'}</td>
                    <td>${event.location || '-'}</td>
                    <td>${reportedMandals.has(event.eventNameId) ? 'रिपोर्ट की गई' : 'रिपोर्ट बाकी'}</td>
                    <td>
                        <button onclick="editEvent('${eventId}')">एडिट</button>
                        <button onclick="deleteEvent('${eventId}')">डिलीट</button>
                    </td>
                `;
                eventList.appendChild(row);
            }
        }

        if (view === 'coordinator') {
            for (const coord of allCoordinators) {
                if (!coord.eventNameId) {
                    console.warn("Coordinator missing eventNameId:", coord);
                    continue;
                }
                const eventNameDoc = await getDoc(doc(db, "eventNames", coord.eventNameId));
                const eventName = eventNameDoc.exists() ? eventNameDoc.data().name : "Unknown";
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${eventName}</td>
                    <td>${coord.mandal || '-'}</td>
                    <td>${coord.name || '-'}</td>
                    <td>${coord.mobile || '-'}</td>
                    <td>${coord.coCoordName1 || '-'}</td>
                    <td>${coord.coCoordMobile1 || '-'}</td>
                    <td>${coord.coCoordName2 || '-'}</td>
                    <td>${coord.coCoordMobile2 || '-'}</td>
                    <td>
                        <button onclick="deleteCoordinator('${coord.eventNameId}', '${coord.id}')">डिलीट</button>
                    </td>
                `;
                coordinatorList.appendChild(row);
            }
        }

        if (view === 'report') {
            for (const report of allReports) {
                if (!report.eventNameId) {
                    console.warn("Report missing eventNameId:", report);
                    continue;
                }
                const eventNameDoc = await getDoc(doc(db, "eventNames", report.eventNameId));
                const eventName = eventNameDoc.exists() ? eventNameDoc.data().name : "Unknown";
                const photosHtml = report.photos?.length ? report.photos.map(url => `<img src="${url}" alt="Report Photo">`).join(' ') : '-';
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${eventName}</td>
                    <td>${report.mandal || '-'}</td>
                    <td>${report.location || '-'}</td>
                    <td>${report.attendance || '-'}</td>
                    <td>${report.guests || '-'}</td>
                    <td>${report.details || '-'}</td>
                    <td>${photosHtml}</td>
                    <td>
                        <button onclick="deleteReport('${report.eventNameId}', '${report.id}')">डिलीट</button>
                    </td>
                `;
                reportList.appendChild(row);
            }

            allReports.forEach((report) => {
                report.photos?.forEach((photoUrl) => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.innerHTML = `<img src="${photoUrl}" alt="Event Photo">`;
                    swiperWrapper.appendChild(slide);
                });
            });

            new Swiper('.swiper', {
                loop: true,
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                slidesPerView: 1,
                spaceBetween: 10,
            });
        }

        const nonReported = mandals.filter(mandal => !Array.from(reportedMandals).some(id => {
            const event = querySnapshot.docs.find(doc => doc.data().eventNameId === id);
            return event && event.data().mandal === mandal;
        }));
        if (nonReported.length > 0) sendTelegramAlert(`रिपोर्ट बाकी मंडल: ${nonReported.join(', ')}`);

        console.log("Events loaded:", querySnapshot.docs.length);
        console.log("Coordinators loaded:", allCoordinators.length);
        console.log("Reports loaded:", allReports.length);
    } catch (error) {
        console.error("Error loading events: ", error);
        alert("त्रुटि: डेटा लोड करने में समस्या: " + error.message);
    }
}
export { loadEvents };

async function editEventName(eventNameId, currentName) {
    const newName = prompt("नया कार्यक्रम का नाम:", currentName);
    if (newName) {
        try {
            await updateDoc(doc(db, "eventNames", eventNameId), { name: newName });
            alert("कार्यक्रम का नाम अपडेट किया गया!");
            loadEventNames();
        } catch (error) {
            console.error("Error updating event name: ", error);
            alert("त्रुटि: कार्यक्रम का नाम अपडेट करने में समस्या: " + error.message);
        }
    }
}
export { editEventName };
window.editEventName = editEventName;

async function editEvent(eventId) {
    const eventDoc = doc(db, "events", eventId);
    const event = (await getDocs(collection(db, "events"))).docs.find(d => d.id === eventId).data();
    const newEventNameId = prompt("नया कार्यक्रम का नाम ID:", event.eventNameId);
    const newMandal = prompt("नया मंडल:", event.mandal);
    const newDate = prompt("नई तारीख (YYYY-MM-DD):", event.date);
    const newTime = prompt("नया समय (HH:MM):", event.time);
    const newLocation = prompt("नया स्थान:", event.location);
    if (newEventNameId && newMandal && newDate && newTime && newLocation) {
        try {
            await updateDoc(eventDoc, {
                eventNameId: newEventNameId,
                mandal: newMandal,
                date: newDate,
                time: newTime,
                location: newLocation
            });
            alert("कार्यक्रम अपडेट किया गया!");
            loadEvents();
        } catch (error) {
            console.error("Error updating event: ", error);
            alert("त्रुटि: कार्यक्रम अपडेट करने में समस्या: " + error.message);
        }
    }
}
export { editEvent };
window.editEvent = editEvent;

async function deleteEvent(eventId) {
    if (confirm("क्या आप इस कार्यक्रम को डिलीट करना चाहते हैं?")) {
        try {
            await deleteDoc(doc(db, "events", eventId));
            alert("कार्यक्रम डिलीट किया गया!");
            loadEvents();
        } catch (error) {
            console.error("Error deleting event: ", error);
            alert("त्रुटि: कार्यक्रम डिलीट करने में समस्या: " + error.message);
        }
    }
}
export { deleteEvent };
window.deleteEvent = deleteEvent;

async function deleteCoordinator(eventNameId, coordinatorId) {
    if (confirm("क्या आप इस संयोजक को डिलीट करना चाहते हैं?")) {
        try {
            await deleteDoc(doc(db, `eventNames/${eventNameId}/coordinators`, coordinatorId));
            alert("संयोजक डिलीट किया गया!");
            loadEvents();
        } catch (error) {
            console.error("Error deleting coordinator: ", error);
            alert("त्रुटि: संयोजक डिलीट करने में समस्या: " + error.message);
        }
    }
}
export { deleteCoordinator };
window.deleteCoordinator = deleteCoordinator;

async function deleteReport(eventNameId, reportId) {
    if (confirm("क्या आप इस रिपोर्ट को डिलीट करना चाहते हैं?")) {
        try {
            await deleteDoc(doc(db, `eventNames/${eventNameId}/reports`, reportId));
            alert("रिपोर्ट डिलीट की गई!");
            loadEvents();
        } catch (error) {
            console.error("Error deleting report: ", error);
            alert("त्रुटि: रिपोर्ट डिलीट करने में समस्या: " + error.message);
        }
    }
}
export { deleteReport };
window.deleteReport = deleteReport;

async function sendTelegramAlert(message) {
    console.log("Telegram alert skipped for testing: ", message);
}
export { sendTelegramAlert };
window.sendTelegramAlert = sendTelegramAlert;

async function exportToCSV() {
    let csv = "Event Name,Mandal,Date,Time,Location,Report Status\n";
    try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const reportedMandals = new Set();
        const eventNamesSnapshot = await getDocs(collection(db, "eventNames"));
        for (const eventNameDoc of eventNamesSnapshot.docs) {
            const reportsSnapshot = await getDocs(collection(db, `eventNames/${eventNameDoc.id}/reports`));
            if (!reportsSnapshot.empty) reportedMandals.add(eventNameDoc.id);
        }
        for (const doc of querySnapshot.docs) {
            const event = doc.data();
            const eventNameDoc = await getDoc(doc(db, "eventNames", event.eventNameId));
            const eventName = eventNameDoc.exists() ? eventNameDoc.data().name : "Unknown";
            csv += `${eventName},${event.mandal || '-'},${event.date || '-'},${event.time || '-'},${event.location || '-'},${reportedMandals.has(event.eventNameId) ? 'Reported' : 'Not Reported'}\n`;
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'events.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting to CSV: ", error);
    }
}
export { exportToCSV };
window.exportToCSV = exportToCSV;

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("BJP मंडल इवेंट रिपोर्ट", 10, 10);
    doc.setFontSize(12);
    let y = 20;
    try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const reportedMandals = new Set();
        const eventNamesSnapshot = await getDocs(collection(db, "eventNames"));
        for (const eventNameDoc of eventNamesSnapshot.docs) {
            const reportsSnapshot = await getDocs(collection(db, `eventNames/${eventNameDoc.id}/reports`));
            if (!reportsSnapshot.empty) reportedMandals.add(eventNameDoc.id);
        }
        for (const doc of querySnapshot.docs) {
            const event = doc.data();
            const eventNameDoc = await getDoc(doc(db, "eventNames", event.eventNameId));
            const eventName = eventNameDoc.exists() ? eventNameDoc.data().name : "Unknown";
            doc.text(`${eventName} - ${event.mandal || '-'} (${event.date || '-'}, ${event.time || '-'}, ${event.location || '-'}) - ${reportedMandals.has(event.eventNameId) ? 'रिपोर्ट की गई' : 'रिपोर्ट बाकी'}`, 10, y);
            y += 10;
            if (y > 270) {
                doc.addPage();
                y = 10;
            }
        }
        doc.save("events.pdf");
    } catch (error) {
        console.error("Error exporting to PDF: ", error);
    }
}
export { exportToPDF };
window.exportToPDF = exportToPDF;
