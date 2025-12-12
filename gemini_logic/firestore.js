import { db, auth } from './config.js';

// --- Get User Settings ---
async function getUserSettings() {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user logged in to fetch settings.");
    return null;
  }
  try {
    const doc = await db.collection("users").doc(user.uid).get();
    if (doc.exists) {
      return doc.data().preferences;
    } else {
      console.log("No user settings found for", user.uid);
      return null;
    }
  } catch (error) {
    console.error("Error getting user settings:", error);
    return null;
  }
}

// --- Update User Settings ---
async function updateUserSettings(newSettings) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user logged in to update settings.");
    return false;
  }
  try {
    await db.collection("users").doc(user.uid).update({
      preferences: newSettings
    });
    console.log("User settings updated successfully.");
    return true;
  } catch (error) {
    console.error("Error updating user settings:", error);
    return false;
  }
}

// --- Add Saved Location ---
async function addSavedLocation(location) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user logged in to add location.");
    return false;
  }
  try {
    await db.collection("users").doc(user.uid).update({
      savedLocations: firebase.firestore.FieldValue.arrayUnion(location)
    });
    console.log("Location added successfully:", location);
    return true;
  } catch (error) {
    console.error("Error adding saved location:", error);
    return false;
  }
}

// --- Get Saved Locations ---
async function getSavedLocations() {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user logged in to get saved locations.");
    return [];
  }
  try {
    const doc = await db.collection("users").doc(user.uid).get();
    if (doc.exists) {
      return doc.data().savedLocations || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting saved locations:", error);
    return [];
  }
}

// --- Remove Saved Location ---
async function removeSavedLocation(location) {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No user logged in to remove location.");
    return false;
  }
  try {
    await db.collection("users").doc(user.uid).update({
      savedLocations: firebase.firestore.FieldValue.arrayRemove(location)
    });
    console.log("Location removed successfully:", location);
    return true;
  } catch (error) {
    console.error("Error removing saved location:", error);
    return false;
  }
}

export { getUserSettings, updateUserSettings, addSavedLocation, getSavedLocations, removeSavedLocation };