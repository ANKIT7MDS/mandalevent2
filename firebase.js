import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    projectId: "mandaleventall",
    storageBucket: "mandaleventall.firebasestorage.app",
    messagingSenderId: "900190130114",
    appId: "1:900190130114:web:bc7d9e2283b3ac57bc505b",
    measurementId: "G-2BBZZNRS88"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
