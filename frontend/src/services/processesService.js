import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

const processesService = {
  // Obtener todos los procesos desde Firebase
  getProcesses: async () => {
    try {
      const q = query(collection(db, 'processes'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching processes from Firebase:', error);
      return [];
    }
  },

  // Obtener todos los subprocesos desde Firebase
  getSubprocesses: async () => {
    try {
      const q = query(collection(db, 'subprocesses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching subprocesses from Firebase:', error);
      return [];
    }
  },

  // Crear nuevo proceso en Firebase
  createProcess: async (processData) => {
    try {
      const docRef = await addDoc(collection(db, 'processes'), {
        ...processData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const newProcess = {
        id: docRef.id,
        ...processData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Proceso creado en Firebase con ID:', docRef.id);
      return newProcess;
    } catch (error) {
      console.error('Error creating process in Firebase:', error);
      throw error;
    }
  },

  // Crear nuevo subproceso en Firebase
  createSubprocess: async (subprocessData) => {
    try {
      const docRef = await addDoc(collection(db, 'subprocesses'), {
        ...subprocessData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const newSubprocess = {
        id: docRef.id,
        ...subprocessData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Subproceso creado en Firebase con ID:', docRef.id);
      return newSubprocess;
    } catch (error) {
      console.error('Error creating subprocess in Firebase:', error);
      throw error;
    }
  },

  // Actualizar proceso en Firebase
  updateProcess: async (id, processData) => {
    try {
      const docRef = doc(db, 'processes', id);
      await updateDoc(docRef, {
        ...processData,
        updatedAt: new Date().toISOString()
      });

      const updated = {
        id,
        ...processData,
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Proceso actualizado en Firebase:', id);
      return updated;
    } catch (error) {
      console.error('Error updating process in Firebase:', error);
      throw error;
    }
  },

  // Buscar documento de subproceso por campo legacy id
  findSubprocessDocIdByLegacyId: async (legacyId) => {
    const q = query(collection(db, 'subprocesses'), where('id', '==', legacyId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    }
    return null;
  },

  // Actualizar subproceso en Firebase
  updateSubprocess: async (id, subprocessData) => {
    try {
      const docRef = doc(db, 'subprocesses', id);
      await updateDoc(docRef, {
        ...subprocessData,
        updatedAt: new Date().toISOString()
      });

      const updated = {
        id,
        ...subprocessData,
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Subproceso actualizado en Firebase:', id);
      return updated;
    } catch (error) {
      const isMissingDoc = error?.code === 'not-found' || String(error?.message).toLowerCase().includes('no document');
      if (isMissingDoc) {
        console.warn('⚠️ Subproceso no encontrado en Firebase con ID directo, buscando por campo legacy id:', id);
        const actualDocId = await processesService.findSubprocessDocIdByLegacyId(id);
        if (actualDocId) {
          console.log('🔎 Encontrado documento legacy con ID real:', actualDocId);
          return await processesService.updateSubprocess(actualDocId, subprocessData);
        }

        console.warn('⚠️ No existe documento legacy, creando nuevo subproceso en Firebase:', id);
        const savedSubprocess = await processesService.createSubprocess(subprocessData);
        return savedSubprocess;
      }
      console.error('Error updating subprocess in Firebase:', error);
      throw error;
    }
  },

  // Eliminar proceso de Firebase
  deleteProcess: async (id) => {
    try {
      const docRef = doc(db, 'processes', id);
      await deleteDoc(docRef);

      console.log('✅ Proceso eliminado de Firebase:', id);
      return { id, deleted: true };
    } catch (error) {
      console.error('Error deleting process from Firebase:', error);
      throw error;
    }
  },

  // Eliminar subproceso de Firebase
  deleteSubprocess: async (id) => {
    try {
      const docRef = doc(db, 'subprocesses', id);
      await deleteDoc(docRef);

      console.log('✅ Subproceso eliminado de Firebase:', id);
      return { id, deleted: true };
    } catch (error) {
      const isMissingDoc = error?.code === 'not-found' || String(error?.message).toLowerCase().includes('no document');
      if (isMissingDoc) {
        console.warn('⚠️ Subproceso no encontrado al eliminar con ID directo, buscando documento legacy:', id);
        const actualDocId = await processesService.findSubprocessDocIdByLegacyId(id);
        if (actualDocId) {
          const docRef = doc(db, 'subprocesses', actualDocId);
          await deleteDoc(docRef);
          const allSubprocesses = await processesService.getSubprocesses();
          const filtered = allSubprocesses.filter(s => s.id !== id && s.id !== actualDocId);
          localStorage.setItem('subprocesses', JSON.stringify(filtered));
          console.log('✅ Subproceso legacy eliminado de Firebase:', actualDocId);
          return { id: actualDocId, deleted: true };
        }
      }
      console.error('Error deleting subprocess from Firebase:', error);
      throw error;
    }
  },
  syncProcessesToFirebase: async (processes) => {
    try {
      let syncedCount = 0;
      for (const process of processes) {
        try {
          await addDoc(collection(db, 'processes'), {
            ...process,
            createdAt: process.createdAt || new Date().toISOString(),
            updatedAt: process.updatedAt || new Date().toISOString()
          });
          syncedCount++;
        } catch (error) {
          console.error('Error syncing process:', error);
        }
      }
      console.log(`✅ ${syncedCount} procesos sincronizados a Firebase`);
      return { synced: syncedCount, total: processes.length };
    } catch (error) {
      console.error('Error syncing processes to Firebase:', error);
      throw error;
    }
  }
};

export default processesService;
