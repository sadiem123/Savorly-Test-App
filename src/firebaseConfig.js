import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBAuqO3q3JdGQj4v7L9sz8-KnWLifp1vl8',
  authDomain: 'savorly-8f562.firebaseapp.com',
  projectId: 'savorly-8f562',
  storageBucket: 'savorly-8f562.firebasestorage.app',
  messagingSenderId: '259765512306',
  appId: '1:259765512306:web:c662e8f59c758c9f3afaeb',
  measurementId: 'G-963WH6WDDX',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };