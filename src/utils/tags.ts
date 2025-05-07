import { db } from '@/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export interface Tag {
  id: string;
  displayName: string;
  pasteValue: string;
  type: 'html' | 'component';
}

const TAGS_COLLECTION = 'tags';

export async function getTags(): Promise<Tag[]> {
  const snapshot = await getDocs(collection(db, TAGS_COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
}

export async function addTag(tag: Omit<Tag, 'id'>): Promise<void> {
  await addDoc(collection(db, TAGS_COLLECTION), tag);
}

export async function updateTag(id: string, updates: Partial<Tag>): Promise<void> {
  await updateDoc(doc(db, TAGS_COLLECTION, id), updates);
}

export async function deleteTag(id: string): Promise<void> {
  await deleteDoc(doc(db, TAGS_COLLECTION, id));
} 