import { db } from './firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    deleteDoc,
    getDoc,
    Timestamp,
    addDoc,
    updateDoc,
    arrayUnion,
    writeBatch
} from 'firebase/firestore';
import { Page, Workspace, UserProfile } from '../types';

class PersistenceService {
    private debounces: Map<string, NodeJS.Timeout> = new Map();

    // ==========================================
    // WORKSPACE METHODS
    // ==========================================

    async createWorkspace(userId: string, name: string, type: 'private' | 'public', isProtected: boolean = false): Promise<Workspace> {
        const workspaceId = doc(collection(db, 'workspaces')).id;
        const batch = writeBatch(db);

        const workspaceData: any = {
            name,
            type,
            ownerId: userId,
            createdAt: Timestamp.fromDate(new Date()),
            isProtected
        };

        if (type === 'public') {
            workspaceData.inviteCode = this.generateInviteCode();
        }

        // 1. Create Workspace Doc
        const workspaceRef = doc(db, 'workspaces', workspaceId);
        batch.set(workspaceRef, workspaceData);

        // 2. Add Owner as Member
        const memberRef = doc(db, 'workspaces', workspaceId, 'members', userId);
        batch.set(memberRef, {
            role: 'owner',
            joinedAt: Timestamp.now()
        });

        // 3. Update User's Workspace List
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
            workspaceIds: arrayUnion(workspaceId)
        });

        await batch.commit();

        return {
            id: workspaceId,
            ...workspaceData,
            role: 'owner'
        };
    }

    async fetchUserWorkspaces(workspaceIds: string[]): Promise<Workspace[]> {
        if (!workspaceIds || workspaceIds.length === 0) return [];

        const workspaces: Workspace[] = [];
        // Firestore 'in' query supports up to 10 items. If more, we need to batch or fetch individually.
        // For simplicity/safety, we'll fetch individually or in chunks. Logic simplifies to individual for now to ensure robustness.
        // Optimization: Use `Promise.all`

        const promises = workspaceIds.map(async (id) => {
            const snap = await getDoc(doc(db, 'workspaces', id));
            if (snap.exists()) {
                const data = snap.data();
                return {
                    id: snap.id,
                    name: data.name,
                    type: data.type,
                    ownerId: data.ownerId,
                    inviteCode: data.inviteCode,
                    createdAt: (data.createdAt as Timestamp).toDate(),
                    // We can't easily get 'role' here without fetching member doc. 
                    // For listing, maybe role isn't strictly necessary, or we fetch it if needed.
                    // Let's assume for the list we don't need distinct role per item yet, or we fetch lazily.
                } as Workspace;
            }
            return null;
        });

        const results = await Promise.all(promises);
        return results.filter((w): w is Workspace => w !== null);
    }

    async joinWorkspaceByInvite(userId: string, inviteCode: string): Promise<Workspace | null> {
        // Query for workspace with this invite code
        const q = query(collection(db, 'workspaces'), where('inviteCode', '==', inviteCode), where('type', '==', 'public'));
        const sn = await getDocs(q);

        if (sn.empty) return null;

        const workspaceDoc = sn.docs[0];
        const workspaceId = workspaceDoc.id;
        const workspaceData = workspaceDoc.data();

        // Check if already a member?
        // Rely on security rules or check here.
        // Add member
        await setDoc(doc(db, 'workspaces', workspaceId, 'members', userId), {
            role: 'member',
            joinedAt: Timestamp.now()
        });

        // Update User
        await updateDoc(doc(db, 'users', userId), {
            workspaceIds: arrayUnion(workspaceId)
        });

        return {
            id: workspaceId,
            name: workspaceData.name,
            type: workspaceData.type,
            ownerId: workspaceData.ownerId,
            inviteCode: workspaceData.inviteCode,
            createdAt: (workspaceData.createdAt as Timestamp).toDate(),
            role: 'member'
        } as Workspace;
    }

    async renameWorkspace(workspaceId: string, newName: string) {
        await updateDoc(doc(db, 'workspaces', workspaceId), {
            name: newName
        });
    }

    async deleteWorkspace(workspaceId: string) {
        // 1. Check if protected (optional safety, UI should handle)
        // 2. Delete workspace doc
        await deleteDoc(doc(db, 'workspaces', workspaceId));
        // 3. Remove validation from users? 
        // Ideally we should remove this workspaceId from all members' workspaceIds array.
        // For now, let's just delete the doc. The fetchUserWorkspaces will filter out nulls (missing docs) so it self-heals.
        // A Cloud Function trigger is better for cleanup, but for now this is fine.
    }

    // ==========================================
    // PAGE METHODS (Scoped to Workspace)
    // ==========================================

    async fetchPages(workspaceId: string): Promise<Page[]> {
        // Try cache first
        const cacheKey = `pages_${workspaceId}`;
        const cached = localStorage.getItem(cacheKey);

        // Return cached immediately if available, but trigger fresh fetch
        // Or standard: await fetch.
        // Let's stick to simple await for now to ensure data consistency during dev.

        const q = query(collection(db, 'workspaces', workspaceId, 'pages'));
        const snapshot = await getDocs(q);
        const pages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                updatedAt: (data.updatedAt as Timestamp).toDate()
            } as Page;
        });

        localStorage.setItem(cacheKey, JSON.stringify(pages));
        return pages;
    }

    async savePage(workspaceId: string, page: Page, debounceMs: number = 2000) {
        // Update local cache immediately
        const cacheKey = `pages_${workspaceId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const pages = JSON.parse(cached) as Page[];
            const index = pages.findIndex(p => p.id === page.id);
            if (index !== -1) {
                pages[index] = page;
            } else {
                pages.push(page);
            }
            localStorage.setItem(cacheKey, JSON.stringify(pages));
        }

        // Debounce Firestore Write
        // Unique debounce key by workspace+page
        const debounceKey = `${workspaceId}_${page.id}`;
        if (this.debounces.has(debounceKey)) {
            clearTimeout(this.debounces.get(debounceKey));
        }

        return new Promise<void>((resolve) => {
            const timeout = setTimeout(async () => {
                try {
                    await setDoc(doc(db, 'workspaces', workspaceId, 'pages', page.id), {
                        ...page,
                        updatedAt: Timestamp.fromDate(new Date())
                    }, { merge: true });
                    this.debounces.delete(debounceKey);
                    resolve();
                } catch (error) {
                    console.error('Error saving page:', error);
                    resolve();
                }
            }, debounceMs);

            this.debounces.set(debounceKey, timeout);
        });
    }

    async savePageMetadata(workspaceId: string, updates: Partial<Page> & { id: string }) {
        const cacheKey = `pages_${workspaceId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const pages = JSON.parse(cached) as Page[];
            const index = pages.findIndex(p => p.id === updates.id);
            if (index !== -1) {
                pages[index] = { ...pages[index], ...updates };
                localStorage.setItem(cacheKey, JSON.stringify(pages));
            }
        }

        try {
            await setDoc(doc(db, 'workspaces', workspaceId, 'pages', updates.id), {
                ...updates,
                updatedAt: Timestamp.fromDate(new Date())
            }, { merge: true });
        } catch (error) {
            console.error('Error saving page metadata:', error);
        }
    }

    async deletePage(workspaceId: string, pageId: string) {
        const debounceKey = `${workspaceId}_${pageId}`;
        if (this.debounces.has(debounceKey)) {
            clearTimeout(this.debounces.get(debounceKey));
            this.debounces.delete(debounceKey);
        }
        await deleteDoc(doc(db, 'workspaces', workspaceId, 'pages', pageId));

        // Update Cache
        const cacheKey = `pages_${workspaceId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const pages = JSON.parse(cached) as Page[];
            const newPages = pages.filter(p => p.id !== pageId);
            localStorage.setItem(cacheKey, JSON.stringify(newPages));
        }
    }

    // ==========================================
    // USER METHODS
    // ==========================================

    async fetchUserProfile(userId: string): Promise<UserProfile | null> {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: userId, ...docSnap.data() } as UserProfile;
        }
        return null;
    }

    async createUserProfile(user: any) { // user is Firebase User object
        const userProfile: UserProfile = {
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            workspaceIds: []
        };
        await setDoc(doc(db, 'users', user.uid), userProfile, { merge: true });
        return userProfile;
    }

    async saveUserProfile(userId: string, data: Partial<UserProfile>) {
        await setDoc(doc(db, 'users', userId), data, { merge: true });
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private generateInviteCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
}

export const persistenceService = new PersistenceService();
