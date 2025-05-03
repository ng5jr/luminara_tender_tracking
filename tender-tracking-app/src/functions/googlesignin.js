import { auth, signInWithPopup, googleAuthProvider, signOut } from '../firebaseconfig';

const ALLOWED_EMAIL = 'ilmatenderrcyc@gmail.com';
export const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;

      if (user.email !== ALLOWED_EMAIL) {
        
        await auth.signOut(); // Sign out the unauthorized user immediately
      } else {
    
      }
    } catch (error) {
      console.error('Error signing in with Google', error);
      
    }
  };

export const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };