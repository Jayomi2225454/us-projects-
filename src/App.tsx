import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, orderBy, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Sidebar } from './components/Sidebar';
import { CitizenView } from './components/CitizenView';
import { CleanerView } from './components/CleanerView';
import { AdminView } from './components/AdminView';
import { AuthPage } from './components/AuthPage';
import { ViewType, WasteReport, Cleaner, WasteType } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, loadingAuth] = useAuthState(auth);
  const [userRole, setUserRole] = useState<ViewType | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);

  // Fetch user role in real-time
  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setLoadingRole(false);
      return;
    }

    setLoadingRole(true);
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setUserRole(data.role as ViewType);
        
        // If it's the master email but role isn't admin, update it
        if (user.email === 'prishamisha112006@gmail.com' && data.role !== 'admin') {
          updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
        }
      } else if (user.email === 'prishamisha112006@gmail.com') {
        // Auto-assign admin role to master email if doc doesn't exist yet
        setUserRole('admin');
      }
      setLoadingRole(false);
    }, (error) => {
      console.error("Error fetching role:", error);
      setLoadingRole(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time reports
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString()
      })) as WasteReport[];
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, [user]);

  // Real-time cleaners (for admin)
  useEffect(() => {
    if (userRole !== 'admin') return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const cleanersData = snapshot.docs
        .filter(doc => doc.data().role === 'cleaner')
        .map(doc => ({
          id: doc.id,
          name: doc.data().displayName || doc.data().email.split('@')[0],
          dept: 'Plastic' as WasteType, // Default dept
          status: 'Available' as const,
        })) as Cleaner[];
      setCleaners(cleanersData);
    });
    return () => unsubscribe();
  }, [userRole]);

  const handleReportSubmit = async (newReport: WasteReport) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'reports'), {
        ...newReport,
        reporterUid: user.uid,
        timestamp: serverTimestamp(),
        status: 'Pending'
      });
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  const handleAssign = async (reportId: string, cleanerId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'Assigned',
        assignedCleanerId: cleanerId
      });
    } catch (error) {
      console.error("Error assigning report:", error);
    }
  };

  const handleComplete = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'Completed'
      });
    } catch (error) {
      console.error("Error completing report:", error);
    }
  };

  if (loadingAuth || loadingRole || (user && !userRole)) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#000080]" size={48} />
          <p className="font-bold text-[#000080] animate-pulse">
            {user && !userRole ? 'Preparing your dashboard...' : 'SafaiSetu is loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-gray-900 overflow-hidden">
      <Sidebar 
        currentView={userRole || 'citizen'} 
        onViewChange={(view) => setUserRole(view)}
        isRestricted={user?.email !== 'prishamisha112006@gmail.com'}
      />
      
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={userRole}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {userRole === 'citizen' && (
              <CitizenView onReportSubmit={handleReportSubmit} />
            )}
            {userRole === 'cleaner' && (
              <CleanerView reports={reports} onComplete={handleComplete} />
            )}
            {userRole === 'admin' && (
              <AdminView 
                reports={reports} 
                cleaners={cleaners} 
                onAssign={handleAssign} 
                onAddCleaner={() => {}} // Admin can't manually add cleaners in this version
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Indian Flag Accent Bar */}
        <div className="fixed bottom-0 right-0 left-64 h-1 flex">
          <div className="flex-1 bg-[#FF9933]"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-[#138808]"></div>
        </div>
      </main>
    </div>
  );
}
