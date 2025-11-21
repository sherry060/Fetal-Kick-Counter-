
import { AccountInfo } from "../types";

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockGoogleLogin = async (): Promise<AccountInfo> => {
  await delay(1500); // Fake 1.5s loading time
  
  // Returns a mock Google User
  return {
    id: 'google_1092837465',
    provider: 'google',
    email: 'mommy@gmail.com', // Mock email
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' // Random avatar
  };
};

export const mockLogout = async (): Promise<void> => {
  await delay(500);
  return;
};
