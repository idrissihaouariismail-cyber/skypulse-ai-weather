import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";

export async function signupUser(email: string, password: string): Promise<User> {
	const credential = await createUserWithEmailAndPassword(auth, email, password);
	return credential.user;
}

export async function loginUser(email: string, password: string): Promise<User> {
	const credential = await signInWithEmailAndPassword(auth, email, password);
	return credential.user;
}

export async function logoutUser(): Promise<void> {
	await signOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
	return onAuthStateChanged(auth, callback);
}


