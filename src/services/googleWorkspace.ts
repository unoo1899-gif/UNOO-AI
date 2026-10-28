import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google sign in');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// 1. Gmail API: Send Order Confirmation Email
export async function sendOrderEmail(accessToken: string, toEmail: string, subject: string, messageText: string) {
  const emailLines = [
    `To: ${toEmail}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    messageText
  ];
  const email = emailLines.join('\r\n');
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: base64EncodedEmail
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || 'Failed to send email via Gmail API');
  }

  return await response.json();
}

// 2. Google Sheets API: Create or log order to Google Sheet
export async function logOrderToSpreadsheet(accessToken: string, orderData: {
  orderId: string;
  fullName: string;
  schoolName: string;
  whatsapp: string;
  email: string;
  items: string;
  timestamp: string;
}) {
  // First create a new Spreadsheet for Emo Book Service Orders if not exists, or log to a new one
  const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: `Emo Book Service - Pre-Order Inquiries (${new Date().toLocaleDateString()})`
      }
    })
  });

  if (!createSheetRes.ok) {
    const err = await createSheetRes.json();
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const sheetData = await createSheetRes.json();
  const spreadsheetId = sheetData.spreadsheetId;

  // Add header row and order data row
  const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:G2?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [
        ['Order ID', 'Full Name', 'School Name', 'WhatsApp', 'Email', 'Reserved Items', 'Timestamp'],
        [
          orderData.orderId,
          orderData.fullName,
          orderData.schoolName,
          orderData.whatsapp,
          orderData.email,
          orderData.items,
          orderData.timestamp
        ]
      ]
    })
  });

  if (!appendRes.ok) {
    const err = await appendRes.json();
    throw new Error(err.error?.message || 'Failed to append data to Google Spreadsheet');
  }

  return { spreadsheetId, spreadsheetUrl: sheetData.spreadsheetUrl };
}

// 3. Google Drive API: Save order summary text file
export async function saveOrderToDrive(accessToken: string, orderData: {
  orderId: string;
  fullName: string;
  schoolName: string;
  items: string;
  timestamp: string;
}) {
  const metadata = {
    name: `Order_${orderData.orderId}_${orderData.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
    mimeType: 'text/plain'
  };

  const fileContent = `EMO BOOK SERVICE SDN BHD - OFFICIAL ORDER INQUIRY
==============================================
Order ID: ${orderData.orderId}
Customer Name: ${orderData.fullName}
School Name: ${orderData.schoolName}
Timestamp: ${orderData.timestamp}

Reserved Textbooks:
${orderData.items}

Status: Verified Local Warehouse Stock - Pending Dispatch
Warehouse Location: Selangor, Malaysia
`;

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'text/plain' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: form
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to save file to Google Drive');
  }

  return await response.json();
}
