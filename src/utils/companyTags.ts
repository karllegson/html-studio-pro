import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface CompanyTags {
  reviewTags: string[];
  faqTags: string[];
}

export async function getCompanyTags(companyId: string): Promise<CompanyTags | null> {
  const ref = doc(db, 'companyTags', companyId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as CompanyTags;
  }
  return null;
}

export async function setCompanyTags(companyId: string, tags: CompanyTags): Promise<void> {
  const ref = doc(db, 'companyTags', companyId);
  await setDoc(ref, tags, { merge: true });
}

export function subscribeToCompanyTags(companyId: string, callback: (tags: CompanyTags | null) => void) {
  const ref = doc(db, 'companyTags', companyId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as CompanyTags);
    } else {
      callback(null);
    }
  });
} 