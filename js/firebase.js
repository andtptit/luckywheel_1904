import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD37syxua05lTj0GtkU1-YfSIY6VKyAoxA",
  authDomain: "luckywheel1904.firebaseapp.com",
  projectId: "luckywheel1904",
  storageBucket: "luckywheel1904.firebasestorage.app",
  messagingSenderId: "231784061850",
  appId: "1:231784061850:web:26eca826a1c2b573f7b823",
  measurementId: "G-SJF0RWXCET"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };