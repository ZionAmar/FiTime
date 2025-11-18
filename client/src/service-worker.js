/* eslint-env worker */
/* eslint-disable no-restricted-globals */
import { precacheAndRoute } from 'workbox-precaching';

// Workbox מחפש את המשתנה הזה. אנחנו מעבירים את רשימת הקבצים שלו ישירות ל-precacheAndRoute.
precacheAndRoute(self.__WB_MANIFEST);

// ----------------------------------------------------
// מחזור חיים בסיסי (ששמרנו מקודם)
// ----------------------------------------------------

// הפעלה מיידית של ה-Service Worker החדש, במקום להמתין
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// השתלטות על קונטקסטים פתוחים
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated and claimed clients.');
  event.waitUntil(self.clients.claim());
});

// למרות שאין לוגיקת מטמון, הקוד הזה מבטיח שה-Build Tool מזהה את הקובץ כחוקי
console.log('Workbox processing complete.');