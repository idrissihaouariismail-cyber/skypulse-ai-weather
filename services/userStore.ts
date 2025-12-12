import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

export interface UserPreferences {
	unit: "celsius" | "fahrenheit" | "C" | "F";
	theme: "light" | "dark";
	language: string;
}

export async function getUserSettings(): Promise<UserPreferences | null> {
	const user = auth.currentUser;
	if (!user) return null;
	const ref = doc(db, "users", user.uid);
	const snap = await getDoc(ref);
	if (!snap.exists()) return null;
	return (snap.data() as any).preferences ?? null;
}

export async function updateUserSettings(newSettings: UserPreferences): Promise<boolean> {
	const user = auth.currentUser;
	if (!user) return false;
	const ref = doc(db, "users", user.uid);
	await updateDoc(ref, { preferences: newSettings });
	return true;
}

export async function ensureUserDocument(email: string): Promise<void> {
	const user = auth.currentUser;
	if (!user) return;
	const ref = doc(db, "users", user.uid);
	const snap = await getDoc(ref);
	if (!snap.exists()) {
		await setDoc(ref, {
			email,
			preferences: { unit: "celsius", theme: "dark", language: "en" },
			savedLocations: []
		});
	}
}

export async function addSavedLocation(location: string): Promise<boolean> {
	const user = auth.currentUser;
	if (!user) return false;
	const ref = doc(db, "users", user.uid);
	await updateDoc(ref, { savedLocations: arrayUnion(location) });
	return true;
}

export async function getSavedLocations(): Promise<string[]> {
	const user = auth.currentUser;
	if (!user) return [];
	const ref = doc(db, "users", user.uid);
	const snap = await getDoc(ref);
	if (!snap.exists()) return [];
	return ((snap.data() as any).savedLocations ?? []) as string[];
}

export async function removeSavedLocation(location: string): Promise<boolean> {
	const user = auth.currentUser;
	if (!user) return false;
	const ref = doc(db, "users", user.uid);
	await updateDoc(ref, { savedLocations: arrayRemove(location) });
	return true;
}


