// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { async } from "@firebase/util";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};

// Initialize Firebase
initializeApp(firebaseConfig);

// Now you can use Firebase services like authentication and Firestore
const auth = getAuth();
const db = getFirestore();

// Function to check if the user is authenticated (dummy implementation)
function userIsAuthenticated() {
  // Check your authentication status here (e.g., session, token, etc.)
  // For simplicity, we'll return true for demonstration purposes
  if (localStorage.token && localStorage.id) return true;

  return false;
}

const routes = [
  { path: "index.html", isProtected: true },
  { path: "register.html", isProtected: false },
  { path: "login.html", isProtected: false },
];

// Function to handle protected route access
function handleProtectedRoute(route) {
  const currentRoute = routes.find((r) => r.path === route);

  if (currentRoute) {
    if (
      currentRoute.path === "register.html" ||
      currentRoute.path === "login.html"
    ) {
      if (userIsAuthenticated()) {
        window.location.href = "/";
      }
    } else if (currentRoute.isProtected && !userIsAuthenticated()) {
      // If the route is protected and the user is not authenticated, redirect to the login page
      window.location.href = "login.html";
    }
  } else {
    // Handle unknown routes (e.g., 404)
    window.location.href = "index.html"; // Redirect to a default route or an error page
  }
}

const handleRouteChange = () => {
  const currentPath = window.location.pathname.split("/").pop();
  handleProtectedRoute(currentPath);
};

// Event listener for route changes
window.addEventListener("DOMContentLoaded", handleRouteChange);

// Get references to form elements
const registrationForm = document.getElementById("registration-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const fullNameInput = document.getElementById("fullName");

// Handle registration form submission
if (registrationForm) {
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;
    const fullName = fullNameInput.value;

    try {
      // Create a user with email and password
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          // Signed in
          const user = userCredential.user;
          localStorage.setItem("token", user.accessToken);
          localStorage.setItem("id", user.uid);

          // set doc in firestore user collection
          await setDoc(doc(db, "users", user.uid), {
            fullName: fullName,
            email: email,
            createdAt: Timestamp.fromDate(new Date()),
          });

          alert("Registration successful!");

          // replace the route if user register was successful
          window.history.pushState({}, "", "/");
          handleRouteChange();

          // Clear the form fields
          emailInput.value = "";
          passwordInput.value = "";
          fullNameInput.value = "";
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log({
            errorCode,
            errorMessage,
          });
        });
    } catch (error) {
      alert("Registration failed: " + error.message);
    }
  });
}

// Get references to form elements
const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const loginErrorMsg = document.getElementById("error-msg");

// Handle login form submission
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    try {
      await signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          // Signed in
          const user = userCredential.user;
          localStorage.setItem("token", user.accessToken);
          localStorage.setItem("id", user.uid);

          // alert("Registration successful!");

          // replace the route if user register was successful
          window.history.pushState({}, "", "/");
          handleRouteChange();

          // Clear the form fields
          loginEmailInput.value = "";
          loginPasswordInput.value = "";
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log({
            errorCode,
            errorMessage,
          });
          if (errorCode.includes("auth/user-not-found")) {
            loginErrorMsg.textContent = "User not found";
          }

          if (errorCode.includes("auth/wrong-password")) {
            loginErrorMsg.textContent = "Wrong password";
          }
        });
    } catch (error) {
      console.log(error);
    }
  });
}
