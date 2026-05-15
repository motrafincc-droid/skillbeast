/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, auth, db } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, query, orderBy, getDocs, updateDoc, deleteDoc, where, increment } from 'firebase/firestore';
import { Menu, X, User as UserIcon, Download, BookOpen, BarChart, CheckCircle, Save, ArrowRight, Copy, Check, Tag, Trash2, Package, Link, ChevronDown, Mail, XCircle, Search, ChevronUp, MessageCircle, Shield, Target, Video, Infinity, Users, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('permission-denied')) {
    alert("Permission Denied: দয়া করে চেক করুন আপনি অ্যাডমিন হিসেবে লগইন করা আছেন কিনা।");
  } else {
    alert(`Error: ${errorMessage}`);
  }
  throw new Error(JSON.stringify(errInfo));
}


const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <motion.div 
      initial={false}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="p-5 flex items-center justify-between">
        <h4 className="font-bold text-white text-lg pr-4">{q}</h4>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-blue-400"
        >
          <ChevronDown size={20} />
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-5 pb-5 text-slate-400 leading-relaxed">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Logo = ({ logoUrl }: { logoUrl?: string }) => (
  <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
    {logoUrl ? (
      <img src={logoUrl} alt="Logo" className="h-10 object-contain" referrerPolicy="no-referrer" />
    ) : (
      <>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300">
          <BarChart className="text-white" size={22} />
        </div>
        <div className="text-2xl md:text-3xl font-black tracking-tighter">
          <span className="text-blue-400">Skill</span>
          <span className="text-white">Beast</span>
        </div>
      </>
    )}
  </div>
);

const Footer = ({ landingSettings, onOpenPage }: { landingSettings: any, onOpenPage: (page: string) => void }) => (
  <footer className="bg-slate-950 border-t border-white/10 py-20 px-6 relative overflow-hidden">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
      <div className="col-span-1 md:col-span-2 space-y-8">
        <Logo logoUrl={landingSettings?.logoUrl} />
        <p className="text-slate-400 max-w-sm text-lg leading-relaxed">
          আপনার ব্যবসার আয় বাড়াতে আমরা নিয়ে এসেছি আধুনিক এবং কার্যকর সব আইডিয়া। আমাদের সাথে আপনার উদ্যোগকে আরও এক ধাপ এগিয়ে নিন।
        </p>
        <div className="flex gap-4">
          <a href="mailto:contact@incomescale.com" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group">
            <Mail size={22} className="text-blue-400 group-hover:scale-110 transition-transform" />
          </a>
          <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group">
            <Link size={22} className="text-blue-400 group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
      
      <div>
        <h4 className="font-bold text-white mb-8 text-xl">প্রয়োজনীয় লিংক</h4>
        <ul className="space-y-4 text-slate-400 text-lg">
          <li><button onClick={() => window.scrollTo(0,0)} className="hover:text-blue-400 transition-colors flex items-center gap-2">হোম</button></li>
          <li><button onClick={() => onOpenPage('about')} className="hover:text-blue-400 transition-colors flex items-center gap-2">আমাদের সম্পর্কে</button></li>
          <li><button onClick={() => onOpenPage('privacy')} className="hover:text-blue-400 transition-colors flex items-center gap-2">প্রাইভেসি পলিসি</button></li>
          <li><button onClick={() => onOpenPage('terms')} className="hover:text-blue-400 transition-colors flex items-center gap-2">শর্তাবলী</button></li>
          <li><button onClick={() => onOpenPage('refund')} className="hover:text-blue-400 transition-colors flex items-center gap-2">রিফান্ড পলিসি</button></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-white mb-8 text-xl">পেমেন্ট পার্টনার</h4>
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl flex items-center justify-center group hover:bg-pink-500/10 hover:border-pink-500/40 transition-all duration-300 cursor-default">
             <span className="text-pink-500 font-black italic text-xl tracking-wider">bKash</span>
          </div>
          <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl flex items-center justify-center group hover:bg-orange-500/10 hover:border-orange-500/40 transition-all duration-300 cursor-default">
             <span className="text-orange-500 font-black italic text-xl tracking-wider">Nagad</span>
          </div>
          <p className="text-slate-500 text-sm text-center font-medium">নিরাপদ ও সুরক্ষিত পেমেন্ট গেটওয়ে</p>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 font-medium">
      <p>© {new Date().getFullYear()} SkillBeast. All rights reserved.</p>
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2">Crafted by <span className="text-blue-400 font-bold">BeUddokta</span></span>
      </div>
    </div>
  </footer>
);

// Helper to format image URLs (fix Imgur common links)
const formatImageUrl = (url: string) => {
  if (!url) return '';
  let formatted = url.trim();

  // Handle Imgur links
  if (formatted.includes('imgur.com')) {
    // If it has a fragment like #BDhhfGM, that's often the image ID
    if (formatted.includes('#')) {
      const fragment = formatted.split('#').pop();
      if (fragment && /^[a-zA-Z0-9]+$/.test(fragment) && fragment.length >= 5) {
        return `https://i.imgur.com/${fragment}.png`;
      }
    }

    if (!formatted.includes('i.imgur.com')) {
      const parts = formatted.replace(/\/$/, '').split('/');
      const lastPart = parts[parts.length - 1];
      // Basic check for standard individual image ID (usually 5-7 chars)
      if (lastPart && /^[a-zA-Z0-9]+$/.test(lastPart) && lastPart.length >= 5 && lastPart.length <= 10) {
        return `https://i.imgur.com/${lastPart}.png`;
      }
    }
  }

  // Handle Google Drive file links
  if (formatted.includes('drive.google.com/file/d/')) {
    const driveId = formatted.split('/file/d/')[1]?.split('/')[0]?.split('?')[0];
    if (driveId) {
      return `https://lh3.googleusercontent.com/u/0/d/${driveId}`;
    }
  }

  return formatted;
};

const ChatScreenshotSlider = ({ images }: { images: string[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setItemsToShow(3);
      else if (window.innerWidth >= 768) setItemsToShow(2);
      else setItemsToShow(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!images || images.length === 0) return null;

  const totalPositions = Math.max(1, images.length - itemsToShow + 1);
  const safeIndex = Math.min(currentIndex, totalPositions - 1);

  const next = () => setCurrentIndex((prev) => (prev + 1) % totalPositions);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + totalPositions) % totalPositions);

  return (
    <div className="relative w-full max-w-7xl mx-auto py-10 px-4 group">
      <div className="overflow-hidden">
        <motion.div 
          className="flex gap-6"
          animate={{ x: `calc(-${safeIndex * (100 / itemsToShow)}% - ${safeIndex * (24 / itemsToShow)}px)` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50 && safeIndex < totalPositions - 1) setCurrentIndex(c => c + 1);
            else if (info.offset.x > 50 && safeIndex > 0) setCurrentIndex(c => c - 1);
          }}
        >
          {images.map((src, i) => (
            <motion.div 
              key={i} 
              className="flex-shrink-0 aspect-[9/16] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl group hover:border-blue-500/50 transition-colors relative"
              style={{ width: itemsToShow === 1 ? '100%' : `calc(${100 / itemsToShow}% - ${(24 * (itemsToShow - 1)) / itemsToShow}px)` }}
            >
              <img 
                src={formatImageUrl(src)} 
                referrerPolicy="no-referrer" 
                alt={`Chat Screenshot ${i + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Navigation Arrows */}
      {totalPositions > 1 && (
        <>
          <button 
            onClick={prev}
            disabled={safeIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-slate-900/90 border border-white/10 text-white rounded-full shadow-xl transition-all z-20 ml-2 md:-left-6 ${safeIndex === 0 ? 'opacity-0 cursor-default' : 'opacity-100 hover:bg-blue-600 hover:scale-110 active:scale-95'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={next}
            disabled={safeIndex === totalPositions - 1}
            className={`absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-slate-900/90 border border-white/10 text-white rounded-full shadow-xl transition-all z-20 mr-2 md:-right-6 ${safeIndex === totalPositions - 1 ? 'opacity-0 cursor-default' : 'opacity-100 hover:bg-blue-600 hover:scale-110 active:scale-95'}`}
          >
            <ChevronRight size={24} />
          </button>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: totalPositions }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`transition-all duration-300 rounded-full h-2 ${safeIndex === i ? 'bg-blue-500 w-8' : 'bg-slate-700 w-2 hover:bg-slate-600'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | 'suspended'>('user');
  const [showDashboard, setShowDashboard] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [offerTimeLeft, setOfferTimeLeft] = useState(18 * 60);

  // Offer Timer Logic (18-minute cycle)
  useEffect(() => {
    const cycleTime = 18 * 60 * 1000; // 18 minutes in ms
    
    const updateTimer = () => {
      let startTime = localStorage.getItem('offerTimerStart');
      const now = Date.now();
      
      if (!startTime) {
        startTime = now.toString();
        localStorage.setItem('offerTimerStart', startTime);
      }
      
      let elapsed = now - parseInt(startTime);
      
      // If cycle completed, restart
      if (elapsed >= cycleTime) {
        startTime = now.toString();
        localStorage.setItem('offerTimerStart', startTime);
        elapsed = 0;
      }
      
      const remainingSeconds = Math.max(0, Math.floor((cycleTime - elapsed) / 1000));
      setOfferTimeLeft(remainingSeconds);
    };

    updateTimer(); // Initial check
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'settings' | 'branding' | 'orders' | 'coupons' | 'products' | 'users'>('overview');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOfferPopup(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // Checkout & Orders State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activePageModal, setActivePageModal] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'Bkash',
    senderAccount: '',
    transactionId: ''
  });
  
  // Product State
  const [adminProduct, setAdminProduct] = useState({
   id: 'mainProduct',
     title: '৫১টি নতুন উপার্জনের পথ',
     price: 299,
     downloadLink: '',
     downloadsCount: 0,
     isActive: true
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  // User Dashboard State
  const [userOrders, setUserOrders] = useState<any[]>([]);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const basePrice = adminProduct.price || 299;
  const finalPrice = appliedCoupon 
    ? (appliedCoupon.discountType === 'percentage' 
        ? Math.round(basePrice - (basePrice * appliedCoupon.discountValue / 100)) 
        : Math.max(0, basePrice - appliedCoupon.discountValue))
    : basePrice;

  const [isCopied, setIsCopied] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const chartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const daySales = adminOrders
        .filter(o => o.status === 'approved' && new Date(o.createdAt).toDateString() === dateString)
        .reduce((sum, o) => sum + (o.finalPrice || 0), 0);
        
      last7Days.push({ name: label, sales: daySales });
    }
    return last7Days;
  }, [adminOrders]);

  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  
  // Admin Coupon State
  const [adminCoupons, setAdminCoupons] = useState<any[]>([]);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    isActive: true,
    expiresAt: ''
  });

  useEffect(() => {
    if (!isCheckoutOpen) {
      setCheckoutStep(1);
      setLastOrderId(null);
    }
  }, [isCheckoutOpen]);

  // Handle guest account linking after order
  useEffect(() => {
    if (user && checkoutStep === 3 && lastOrderId) {
      const linkOrderToUser = async () => {
        try {
          const path = `orders/${lastOrderId}`;
          await updateDoc(doc(db, 'orders', lastOrderId), {
            userId: user.uid,
            email: user.email
          });
          setLastOrderId(null);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `orders/${lastOrderId}`);
        }
      };
      linkOrderToUser();
    }
  }, [user, checkoutStep, lastOrderId]);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('01960762225');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleUpdateRole = async (userId: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return;
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, path), { role: newRole });
      setAdminUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
      alert(`User role updated to ${newRole}`);
    } catch(e: any) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  // Fetch common data (like product)
  useEffect(() => {
    const fetchProduct = async () => {
      const path = 'products/mainProduct';
      try {
        const docRef = doc(db, 'products', 'mainProduct');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAdminProduct({ id: docSnap.id, ...docSnap.data() } as any);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    };
    fetchProduct();
  }, []);

  // Fetch admin/user data
  useEffect(() => {
    if (userRole === 'admin' || user?.email === 'motrafincc@gmail.com' || user?.email === 'motrafin14@gmail.com') {
      const fetchOrders = async () => {
        const path = 'orders';
        try {
          const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAdminOrders(orders);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      };

      const fetchCoupons = async () => {
        const path = 'coupons';
        try {
          const snapshot = await getDocs(collection(db, 'coupons'));
          const coupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAdminCoupons(coupons);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      };

      const fetchUsers = async () => {
        const path = 'users';
        try {
          const snapshot = await getDocs(collection(db, 'users'));
          const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAdminUsers(usersList);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      };

      if (showDashboard) fetchOrders();
      if (activeAdminTab === 'coupons' || showDashboard) fetchCoupons();
      if (activeAdminTab === 'users' || activeAdminTab === 'overview' || showDashboard) fetchUsers();
    } else if (user) {
      // Fetch data for normal user dashboard
      const fetchUserOrders = async () => {
        const path = 'orders';
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);
          const myOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserOrders(myOrders);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, path);
        }
      };
      if (showDashboard) fetchUserOrders();
    }
  }, [activeAdminTab, user, showDashboard]);

  const handleApplyCoupon = () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponCode) {
      setCouponError('কুপন কোড দিন');
      return;
    }
    
    setIsApplyingCoupon(true);
    const lowercaseCode = couponCode.toLowerCase();
    const foundCoupon = adminCoupons.find(c => c.code.toLowerCase() === lowercaseCode);
    
    if (foundCoupon) {
      if (!foundCoupon.isActive) {
         setCouponError('এই কুপনটি এখন আর কার্যকর নেই!');
      } else if (foundCoupon.expiresAt && new Date(foundCoupon.expiresAt).getTime() < Date.now()) {
         setCouponError('এই কুপনটির মেয়াদ শেষ হয়ে গেছে!');
      } else {
         setAppliedCoupon(foundCoupon);
         setCouponSuccess('কুপন সফলভাবে যুক্ত হয়েছে!');
      }
    } else {
      setCouponError('অবৈধ কুপন কোড!');
    }
    
    setIsApplyingCoupon(false);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    setIsCreatingCoupon(true);
    const path = 'coupons';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...newCoupon,
        code: newCoupon.code.toUpperCase()
      });
      setAdminCoupons([{ id: docRef.id, ...newCoupon, code: newCoupon.code.toUpperCase() }, ...adminCoupons]);
      setNewCoupon({ code: '', discountType: 'percentage', discountValue: 10, isActive: true, expiresAt: '' });
      alert("Coupon created!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
     const path = `coupons/${id}`;
     try {
       await updateDoc(doc(db, 'coupons', id), { isActive: false }); // Soft delete / deactivate
       setAdminCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: false } : c));
     } catch (err: any) {
       handleFirestoreError(err, OperationType.UPDATE, path);
     }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSavingProduct(true);
     const path = 'products/mainProduct';
     try {
       const sanitizedProduct = JSON.parse(JSON.stringify(adminProduct));
       await setDoc(doc(db, 'products', 'mainProduct'), sanitizedProduct);
       alert("Product details updated successfully!");
     } catch (err: any) {
       console.error(err);
       alert("Failed to save product: " + err.message);
     } finally {
       setIsSavingProduct(false);
     }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.phone || !checkoutForm.senderAccount || !checkoutForm.transactionId) {
      alert("Please fill in all details.");
      return;
    }
    
    setIsSubmittingOrder(true);
    const path = 'orders';
    try {
      const orderData = {
        userId: user ? user.uid : 'guest',
        email: checkoutForm.email,
        name: checkoutForm.name,
        phone: checkoutForm.phone,
        paymentMethod: checkoutForm.paymentMethod,
        senderAccount: checkoutForm.senderAccount,
        transactionId: checkoutForm.transactionId,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        discountAmount: basePrice - finalPrice,
        finalPrice: finalPrice,
        productId: adminProduct.id,
        productTitle: adminProduct.title,
        status: 'pending',
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setLastOrderId(docRef.id);
      setCheckoutStep(3);
      setCheckoutForm({ name: '', email: '', phone: '', paymentMethod: 'Bkash', senderAccount: '', transactionId: '' });
      setAppliedCoupon(null);
      setCouponCode('');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmittingOrder(false);
    }
  };
  
  const handleApproveOrder = async (orderId: string) => {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'approved' });
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'approved' } : o));
      alert("অর্ডার অ্যাপ্রুভ করা হয়েছে!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি রিজেক্ট করতে চান?")) return;
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'rejected' });
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'rejected' } : o));
      alert("অর্ডার রিজেক্ট করা হয়েছে!");
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const path = `orders/${orderId}`;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      setAdminOrders(prev => prev.filter(o => o.id !== orderId));
      alert("অর্ডার সফলভাবে ডিলিট করা হয়েছে!");
    } catch (err: any) {
      console.error("Delete Error:", err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const copyEmailTemplate = (order: any, type: 'approve' | 'reject') => {
    let emailText = '';
    const bookTitle = adminProduct?.title || "our E-Book / Course";
    if (type === 'approve') {
      emailText = `Hello ${order.name},\n\nCongratulations! Your payment has been verified, and your order for "${bookTitle}" is confirmed.\n\nYou can now log in to your dashboard on our website using your email address (${order.email}) to access and download your materials.\n\nWebsite: ${window.location.origin}\n\nThank you for choosing us!\nBest regards,\nIncomeScale Team`;
    } else {
      emailText = `Hello ${order.name},\n\nUnfortunately, we were unable to verify your recent payment (Transaction ID: ${order.transactionId}) for "${bookTitle}". Therefore, your order has been rejected.\n\nPlease double-check that you sent the correct amount to the correct number, and ensure the transaction ID is accurate. If you have any questions or would like to try again, simply reply to this email.\n\nThank you,\nIncomeScale Team`;
    }

    navigator.clipboard.writeText(emailText).then(() => {
      alert(`Copied ${type} email template to clipboard!`);
    }).catch((err) => {
      console.error('Failed to copy', err);
      alert('Failed to copy text. Please copy manually.');
    });
  };
  
  const handleScrollGallery = () => {
    if (galleryRef.current) {
      // Scroll by one card width (85vw + gap on mobile, ~424px on desktop)
      const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.85 + 24 : 424;
      
      // If at the end, scroll back to start
      const isAtEnd = galleryRef.current.scrollLeft + galleryRef.current.clientWidth >= galleryRef.current.scrollWidth - 10;
      if (isAtEnd) {
        galleryRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        galleryRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };
  
  const defaultSettings = {
    heroBadge: "৫০+ ইউনিক আইডিয়া!",
    heroTitle1: "দুর্দান্ত বিজনেস আইডিয়া দিয়ে",
    heroTitleHighlight: "ইনকাম স্কেল বাড়ান!",
    youtubeLink: "",
    whatsappNumber: "",
    coverImage: "",
    previewImages: Array(10).fill(""),
    heroDescription: "পুঁজি কম বলে পিছিয়ে আসছেন বারবার? গতানুগতিক ব্যবসার ভিড়ে না হারিয়ে, অল্প পুঁজিতে নতুন কিছু শুরু করার সাহস যোগাতে আপনার জন্যই তৈরি করা হয়েছে ‘Income Scale: with Unique Business Ideas’ ইবুকটি।",
    buttonText: "এখনই অর্ডার করুন — ১৯৮ টাকা",
    painPointHeading: "আচ্ছা, এই কথাগুলো কি আপনার মনের সাথে মিলে যায়?",
    painPoints: [
      "সবাই তো ওই একই ব্যবসা করছে—জামাকাপড়, খাবার বা গ্যাজেট। এই তীব্র প্রতিযোগিতায় আমি টিকব কীভাবে?",
      "আমার কাছে তো লাখ লাখ টাকা নেই। অল্প কয়েক হাজার টাকা নিয়ে কি আসলেই ভালো কিছু করা সম্ভব?",
      "ইউটিউবে তো অনেক আইডিয়াই দেখি, কিন্তু আমাদের দেশের বাস্তবতায় সেটা কতটুকু কাজ করবে?",
      "হালাল এবং সৎ উপায়ে কি আসলে দ্রুত ইনকাম স্কেল বাড়ানো সম্ভব?"
    ],
    feature1Title: "ভিডিও গাইডসহ আইডিয়া",
    feature1Desc: "প্রতিটি বিজনেসের জন্য রয়েছে বিশেষ কিউআর কোড যা স্ক্যান করলে আপনি পাবেন এক্সক্লুসিভ ভিডিও টিউটোরিয়াল।",
    feature2Title: "ঝুঁকি ও বিনিয়োগ বিশ্লেষণ",
    feature2Desc: "আমরা কেবল সাফল্যের কথা বলি না, আমরা প্রতিটি আইডিয়ার চ্যালেঞ্জ ও সম্ভাব্য ঝুঁকি নিয়ে খোলামেলা আলোচনা করেছি।",
    feature3Title: "সফলদের রিভিউ",
    feature3Desc: "\"এই বইটি পড়ার পর আমি আমার ৩য় সাইড হাস্টল শুরু করেছি যা এখন আমার মূল আয়ের উৎস।\" — আরিয়ান আহমেদ",
    feature4Title: "লাইফটাইম এক্সেস",
    feature4Desc: "একবার এনরোল করলেই ড্যাশবোর্ড থেকে আজীবন এক্সেস এবং ভবিষ্যতের সব আপডেট ফ্রি।",
    feature5Title: "প্রাইভেট কমিউনিটি",
    feature5Desc: "আমাদের এক্সক্লুসিভ মেম্বারশিপ গ্রুপে যুক্ত হওয়ার সুযোগ এবং মেন্টরদের থেকে সরাসরি সাপোর্ট।",
    chatScreenshots: Array(6).fill(""),
    logoUrl: "",
    bengaliFont: "Hind Siliguri",
    aboutUsText: "আমাদের লক্ষ্য হলো শিক্ষার্থীদের নতুন উপার্জনের পথ তৈরি করে দেওয়া।",
    privacyPolicyText: "আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষায় আমরা প্রতিশ্রুতিবদ্ধ।",
    termsConditionsText: "আমাদের ওয়েবসাইট ব্যবহারের জন্য শর্তাবলী এখানে পর্যায়ক্রমে আপডেট হবে।",
    refundPolicyText: "১০০% পেমেন্ট রিফান্ড গ্যারান্টি। আপনার কাছে যদি পড়ে মনেহয় ভালো লাগেনি তাহলে রিফান্ড আস্ক করতে পারেন ৩৬ ঘন্টার মধ্যে。",
    metaPixelId: "",
    faqs: [
      {
        q: "বইটি কি হার্ডকপি নাকি ই-বুক?",
        a: "এটি একটি সম্পূর্ণ ডিজিটাল ই-বুক এবং ভিডিও কোর্স। পেমেন্ট কনফার্ম হওয়ার পর আপনি আপনার ড্যাশবোর্ড থেকে তাৎক্ষণিকভাবে এটি পড়তে এবং ডাউনলোড করতে পারবেন।"
      },
      {
        q: "পেমেন্ট করার কতক্ষণ পর আমি এক্সেস পাব?",
        a: "ম্যানুয়াল পেমেন্ট ভেরিফিকেশনের জন্য সাধারণত ৩০ মিনিট থেকে ২ ঘণ্টা সময় লাগতে পারে। তবে বেশিরভাগ সময় আমরা এর আগেই অর্ডার অ্যাপ্রুভ করে দেই।"
      },
      {
        q: "ভিডিও গাইডগুলো কিভাবে দেখব?",
        a: "বইটির ভেতরে প্রতিটি চ্যাপ্টারের পাশে বিশেষ কিউআর কোড এবং লিংক দেওয়া আছে। আপনার ফোনের ক্যামেরা দিয়ে স্ক্যান করলে বা লিংকে ক্লিক করলে সরাসরি ভিডিওগুলো দেখতে পারবেন।"
      },
      {
        q: "আমি কি পরে কোনো সাপোর্ট পাব?",
        a: "হ্যাঁ! আমাদের একটি ইনসাইডার কমিউনিটি গ্রুপ আছে যেখানে আপনি অন্যান্য উদ্যোক্তাদের সাথে আলোচনা করতে পারবেন এবং আমাদের মেন্টরদের থেকে গাইডলাইন পাবেন।"
      },
      {
        q: "আইডিয়াগুলো কি বাংলাদেশের প্রেক্ষাপটে কার্যকর?",
        a: "অবশ্যই। বইটির প্রতিটি আইডিয়া বাংলাদেশের বর্তমান বাজার, চাহিদা এবং লজিস্টিক সাপোর্ট মাথায় রেখেই তৈরি করা হয়েছে।"
      }
    ]
  };

  const [landingSettings, setLandingSettings] = useState(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);

  // Helper for YouTube embed
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1&loop=1&playlist=${match[2]}` : null;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Limit dimensions for safe database storage
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG to ensure it fits well within Firestore's 1MB document limit
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setLandingSettings(prev => ({ ...prev, [field]: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Handle device limiting logic
        const DEVICE_ID_KEY = 'user_device_id';
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
           deviceId = crypto.randomUUID();
           localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        // Save/Update user in the users collection
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          // Check if user is a customer (has an approved order)
          const ordersQuery = query(
            collection(db, 'orders'), 
            where('userId', '==', currentUser.uid),
            where('status', '==', 'approved')
          );
          const orderSnaps = await getDocs(ordersQuery);
          const isCustomer = !orderSnaps.empty;

          let currentRole = 'user';
          let updateData: any = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            lastLogin: Date.now()
          };

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            currentRole = data.role || 'user';
            
            if (currentRole === 'suspended') {
                setUserRole('suspended');
                const supportMsg = landingSettings.whatsappNumber 
                  ? `আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) করা হয়েছে। পুনরায় চালু করতে আমাদের এই হোয়াটসঅ্যাপে যোগাযোগ করুন: ${landingSettings.whatsappNumber}` 
                  : "আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। দয়া করে অ্যাডমিনের সাথে যোগাযোগ করুন।";
                alert(supportMsg);
                await signOut(auth);
                return;
            }

            let existingDeviceIds = data.deviceIds || [];
            
            // Only enforce device limit for customers (those who paid)
            if (isCustomer && !existingDeviceIds.includes(deviceId)) {
                if (existingDeviceIds.length >= 2) {
                    // Third device found! Suspend the user.
                    currentRole = 'suspended';
                    updateData.role = 'suspended';
                    updateData.deviceIds = [...existingDeviceIds, deviceId];
                    await setDoc(userDocRef, updateData, { merge: true });
                    setUserRole('suspended');
                    const supportMsg = landingSettings.whatsappNumber 
                      ? `ডিভাইস লিমিট অতিক্রম করার কারণে আপনার অ্যাকাউন্টটি সাসপেন্ড করা হয়েছে। ঠিক করতে যোগাযোগ করুন: ${landingSettings.whatsappNumber}`
                      : "ডিভাইস লিমিট অতিক্রম করার কারণে আপনার অ্যাকাউন্টটি সাসপেন্ড করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।";
                    alert(supportMsg);
                    await signOut(auth);
                    return;
                } else {
                    // Add device
                    updateData.deviceIds = [...existingDeviceIds, deviceId];
                }
            } else if (!existingDeviceIds.includes(deviceId)) {
                // Not a customer yet, but record the device anyway (without banning)
                updateData.deviceIds = [...existingDeviceIds, deviceId];
            } else {
              updateData.deviceIds = existingDeviceIds;
            }
          } else {
            // New user login, assign initial device
            if (currentUser.email === 'motrafincc@gmail.com' || currentUser.email === 'motrafin14@gmail.com') {
              currentRole = 'admin';
            }
            updateData.role = currentRole;
            updateData.deviceIds = [deviceId];
          }
          
          setUserRole(currentRole as 'admin' | 'user' | 'suspended');
          await setDoc(userDocRef, updateData, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
        }
      } else {
        setUserRole('user');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const path = 'settings/landingPage';
      try {
        // Try to load cached settings first to prevent flickering
        const cachedSettings = localStorage.getItem('cachedLandingSettings');
        if (cachedSettings) {
          try {
            const parsed = JSON.parse(cachedSettings);
            let previewImages = parsed.previewImages || Array(10).fill("");
            setLandingSettings({ ...defaultSettings, ...parsed, previewImages });
          } catch (e) {}
        }

        const docRef = doc(db, 'settings', 'landingPage');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Migration from old previewImage1 to new array if needed
          let previewImages = data.previewImages || Array(10).fill("");
          if (!data.previewImages && (data.previewImage1 || data.previewImage2)) {
             previewImages = Array(10).fill("");
             previewImages[0] = data.previewImage1 || "";
             previewImages[1] = data.previewImage2 || "";
          }
          
          const newSettings = { ...defaultSettings, ...data, previewImages };
          setLandingSettings(newSettings);
          // Cache for next load
          localStorage.setItem('cachedLandingSettings', JSON.stringify(data));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (landingSettings.metaPixelId) {
      const scriptId = 'meta-pixel-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${landingSettings.metaPixelId || ''}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);

        const noScript = document.createElement('noscript');
        noScript.id = 'meta-pixel-noscript';
        noScript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${landingSettings.metaPixelId || ''}&ev=PageView&noscript=1" />`;
        document.head.appendChild(noScript);
      }
    }
  }, [landingSettings.metaPixelId]);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    const path = 'settings/landingPage';
    try {
      const sanitizedSettings = JSON.parse(JSON.stringify(landingSettings));
      if (sanitizedSettings.chatScreenshots) {
        sanitizedSettings.chatScreenshots = sanitizedSettings.chatScreenshots.map((v: any) => v || "");
      }
      if (sanitizedSettings.previewImages) {
        sanitizedSettings.previewImages = sanitizedSettings.previewImages.map((v: any) => v || "");
      }
      
      await setDoc(doc(db, 'settings', 'landingPage'), sanitizedSettings, { merge: true });
      localStorage.setItem('cachedLandingSettings', JSON.stringify(sanitizedSettings));
      alert('Settings saved successfully!');
    } catch (error: any) {
      console.error(error);
      alert('Failed to save settings: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      setIsLoginOpen(false);
    } catch (error: any) {
      console.error("Login failed", error);
      alert("Login failed: " + (error.message || "Unknown error. Please ensure popups are allowed and third-party cookies are not blocked."));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      alert("Please enter email and password");
      return;
    }
    try {
      if (isSignUp) {
        await signUpWithEmail(loginEmail, loginPassword);
        alert("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!");
      } else {
        await signInWithEmail(loginEmail, loginPassword);
      }
      setIsLoginOpen(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error: any) {
      console.error("Email auth failed", error);
      alert("Error: " + (error.message || "Authentication failed."));
    }
  };

  const testConnection = async () => {
    try {
      if (!window.navigator.onLine) {
        console.error("Browser reports being offline.");
        return;
      }
      const { doc, getDocFromServer } = await import('firebase/firestore');
      await getDocFromServer(doc(db, 'settings', 'landingPage'));
      console.log("Firestore connection successful.");
    } catch (error: any) {
      console.error("Firestore connection failed:", error.message);
      if(error.message?.includes('the client is offline')) {
        console.error("Please check your Firebase configuration or ensure Firestore is enabled in your project.");
      }
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setShowDashboard(false);
  };

  const isAdmin = userRole === 'admin' || user?.email === 'motrafincc@gmail.com' || user?.email === 'motrafin14@gmail.com';

  const overviewStats = {
    activeUsers: adminUsers.length,
    totalSales: adminOrders.filter(o => o.status === 'approved').reduce((sum, o) => sum + (o.finalPrice || 0), 0),
    pendingOrders: adminOrders.filter(o => o.status === 'pending').length,
    totalDownloads: adminProduct.downloadsCount || 0
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-x-hidden" style={{ fontFamily: `'${landingSettings.bengaliFont || 'Hind Siliguri'}', sans-serif` }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=${(landingSettings.bengaliFont || 'Hind Siliguri').replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap');
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b_0%,transparent_50%),radial-gradient(circle_at_70%_70%,#312e81_0%,transparent_50%)] opacity-60 pointer-events-none"></div>
      
      <div className="relative z-10">
        <header className="flex justify-between items-center py-4 px-4 md:py-6 md:px-10 max-w-7xl mx-auto border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-[60]">
          <Logo logoUrl={landingSettings?.logoUrl} />
          <div className="flex items-center gap-2 md:gap-4">
            {user && isAdmin && (
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 hover:bg-white/10 rounded-full transition relative" title="Notifications">
                  <Bell />
                  {overviewStats.pendingOrders > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {overviewStats.pendingOrders}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-white/10 rounded-xl shadow-2xl p-4 overflow-hidden z-20">
                    <h4 className="text-white font-bold mb-3 border-b border-white/10 pb-2">Notifications</h4>
                    {overviewStats.pendingOrders > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-300">
                          You have <span className="text-amber-400 font-bold">{overviewStats.pendingOrders}</span> new pending order(s) waiting for approval.
                        </p>
                        <button 
                          onClick={() => {
                            setShowDashboard(true);
                            setActiveAdminTab('orders');
                            setShowNotifications(false);
                          }}
                          className="w-full text-center text-sm bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                        >
                          View Orders
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-4">No new notifications</p>
                    )}
                  </div>
                )}
              </div>
            )}
            {user && (
               <button onClick={() => setShowDashboard(!showDashboard)} className="p-2 hover:bg-white/10 rounded-full transition" title="Toggle Dashboard">
                 {showDashboard ? <X /> : <Menu />}
               </button>
            )}
            
            {user ? (
              <button 
                onClick={handleLogout}
                className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 md:px-5 py-2 rounded-full text-sm md:text-base font-medium hover:bg-red-500/20 transition"
              >
                লগআউট
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-white/5 border border-white/20 text-white px-5 py-2 rounded-full font-medium hover:bg-white/10 transition"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {showDashboard ? (
          <main className="max-w-7xl mx-auto py-16 px-10">
            {isAdmin ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white">Admin <span className="text-blue-400">Panel</span></h1>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setActiveAdminTab('overview')} 
                         className={`px-4 py-2 rounded-full font-medium transition ${activeAdminTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                       >
                         Overview
                       </button>
                       <button 
                         onClick={() => setActiveAdminTab('settings')} 
                         className={`px-4 py-2 rounded-full font-medium transition ${activeAdminTab === 'settings' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                       >
                         Landing Settings
                       </button>
                       <button 
                         onClick={() => setActiveAdminTab('branding')} 
                         className={`px-4 py-2 rounded-full font-medium transition ${activeAdminTab === 'branding' ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                       >
                         Branding & Pages
                       </button>
                    </div>
                  </div>

                  {activeAdminTab === 'overview' ? (
                    <div className="space-y-8">
                      {/* Quick Stats Grid */}
                      {/* ... existing stats ... */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <span className="text-slate-400 text-xs md:text-sm font-semibold mb-2 block uppercase tracking-wider">Active Users</span>
                            <span className="text-3xl font-black text-blue-400">{overviewStats.activeUsers < 10 && overviewStats.activeUsers > 0 ? `0${overviewStats.activeUsers}` : overviewStats.activeUsers}</span>
                         </div>
                         <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <span className="text-slate-400 text-xs md:text-sm font-semibold mb-2 block uppercase tracking-wider">Total Sales</span>
                            <span className="text-3xl font-black text-emerald-400">৳{overviewStats.totalSales.toLocaleString('en-IN')}</span>
                         </div>
                         <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <span className="text-slate-400 text-xs md:text-sm font-semibold mb-2 block uppercase tracking-wider">Pending Orders</span>
                            <span className="text-3xl font-black text-amber-400">{overviewStats.pendingOrders < 10 && overviewStats.pendingOrders > 0 ? `0${overviewStats.pendingOrders}` : overviewStats.pendingOrders}</span>
                         </div>
                         <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                            <span className="text-slate-400 text-xs md:text-sm font-semibold mb-2 block uppercase tracking-wider">Total Downloads</span>
                            <span className="text-3xl font-black text-purple-400">{overviewStats.totalDownloads < 10 && overviewStats.totalDownloads > 0 ? `0${overviewStats.totalDownloads}` : overviewStats.totalDownloads}</span>
                         </div>
                      </div>

                      {/* Chart and Quick Actions */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Chart Area */}
                        <div className="p-6 md:p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl lg:col-span-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                          <h3 className="font-bold text-lg mb-6 flex items-center gap-3"><BarChart className="text-emerald-400" size={24}/> Collection Trend (Last 7 Days)</h3>
                          <div className="w-full h-[250px] md:h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                                <Area type="monotone" dataKey="sales" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        {/* Quick Access List */}
                        <div className="flex flex-col gap-6">
                          <div onClick={() => setActiveAdminTab('orders')} className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition group">
                             <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition"><CheckCircle size={28}/></div>
                             <div>
                                <h4 className="font-bold text-lg">Approve Orders</h4>
                                <p className="text-sm text-slate-400">Review pending requests</p>
                             </div>
                          </div>

                          <div onClick={() => setActiveAdminTab('users')} className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition group">
                             <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition"><UserIcon size={28}/></div>
                             <div>
                                <h4 className="font-bold text-lg">User List</h4>
                                <p className="text-sm text-slate-400">Manage members & roles</p>
                             </div>
                          </div>

                          <div onClick={() => setActiveAdminTab('coupons')} className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition group">
                             <div className="p-4 bg-orange-500/20 text-orange-400 rounded-2xl group-hover:bg-orange-500 group-hover:text-white transition"><Tag size={28}/></div>
                             <div>
                                <h4 className="font-bold text-lg">Manage Coupons</h4>
                                <p className="text-sm text-slate-400">Create & edit discounts</p>
                             </div>
                          </div>

                          <div onClick={() => setActiveAdminTab('products')} className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition group">
                             <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition"><Package size={28}/></div>
                             <div>
                                <h4 className="font-bold text-lg">Product Target</h4>
                                <p className="text-sm text-slate-400">Set price & download links</p>
                             </div>
                          </div>

                          <div onClick={() => setActiveAdminTab('settings')} className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition group">
                             <div className="p-4 bg-purple-500/20 text-purple-400 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition"><BookOpen size={28}/></div>
                             <div>
                                <h4 className="font-bold text-lg">App Settings</h4>
                                <p className="text-sm text-slate-400">Update app landing text</p>
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeAdminTab === 'orders' ? (
                    <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                       <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                         <h3 className="text-2xl font-bold text-white">Manage Orders</h3>
                         <div className="relative w-full md:w-64">
                           <input 
                             type="text" 
                             placeholder="Search orders..." 
                             value={orderSearchQuery || ""}
                             onChange={(e) => setOrderSearchQuery(e.target.value)}
                             className="w-full bg-slate-800 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                           />
                           <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                         </div>
                       </div>
                       <div className="space-y-4">
                         {adminOrders.length === 0 ? (
                           <p className="text-slate-400 py-8 text-center border border-white/10 border-dashed rounded-xl">No orders found.</p>
                         ) : (
                           adminOrders.filter(order => 
                             order.name?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                             order.email?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                             order.phone?.includes(orderSearchQuery) ||
                             order.transactionId?.toLowerCase().includes(orderSearchQuery.toLowerCase())
                           ).map(order => (
                             <div key={order.id} className="p-6 bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-2xl flex flex-col xl:flex-row justify-between items-start gap-5 shadow-lg">
                               <div className="flex-1 space-y-4 w-full">
                                 <div className="flex flex-wrap items-center gap-3">
                                   <h4 className="font-bold text-xl text-white">{order.name}</h4>
                                   <span className={`px-3 py-1 text-[10px] uppercase font-black tracking-wider rounded-full ${order.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : order.status === 'rejected' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                     {order.status}
                                   </span>
                                   <span className="text-xs text-slate-500 font-medium ml-auto">{new Date(order.createdAt).toLocaleString()}</span>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                   <div>
                                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Contact Info</p>
                                     <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                       <p className="text-sm text-slate-300 font-medium">{order.email}</p>
                                       <button onClick={() => copyEmailTemplate(order, 'approve')} title="Copy Approve Msg" className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition flex items-center justify-center border border-emerald-500/20">
                                         <Mail size={12} />
                                         <span className="text-[10px] ml-1.5 font-bold">Approve Msg</span>
                                       </button>
                                       <button onClick={() => copyEmailTemplate(order, 'reject')} title="Copy Reject Msg" className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition flex items-center justify-center border border-red-500/20">
                                         <Mail size={12} />
                                         <span className="text-[10px] ml-1.5 font-bold">Reject Msg</span>
                                       </button>
                                     </div>
                                     <p className="text-sm text-slate-400">{order.phone}</p>
                                   </div>
                                   <div>
                                     <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Payment Details {order.finalPrice && <span className="text-emerald-400 normal-case font-medium ml-1">(Total: {order.finalPrice} ৳)</span>}</p>
                                     <p className="text-sm text-slate-400 mb-1">Method: <span className="font-medium text-slate-200">{order.paymentMethod}</span></p>
                                     <p className="text-sm text-slate-400 mb-1">Sender: <span className="font-medium text-slate-200">{order.senderAccount}</span></p>
                                     <p className="text-sm text-slate-400">TrxID: <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{order.transactionId}</span></p>
                                   </div>
                                 </div>

                                 {order.couponCode && (
                                   <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex flex-wrap items-center gap-2 text-sm">
                                     <Tag size={16} className="text-orange-400 shrink-0"/>
                                     <span className="text-orange-200">Coupon: <strong className="text-orange-400 tracking-wider bg-orange-500/20 px-2 py-0.5 rounded ml-1">{order.couponCode}</strong></span>
                                     <span className="text-orange-200 ml-auto whitespace-nowrap">Paid: <strong className="text-orange-400">{order.finalPrice} ৳</strong> <span className="opacity-75 text-xs">(Discounted {order.discountAmount} ৳)</span></span>
                                   </div>
                                 )}
                               </div>

                               <div className="flex flex-row xl:flex-col gap-3 w-full xl:w-40 shrink-0 justify-end mt-2 xl:mt-0">
                                 {order.status === 'pending' && (
                                   <>
                                     <button onClick={() => handleApproveOrder(order.id)} className="flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                                       <CheckCircle size={18}/> Approve
                                     </button>
                                     <button onClick={() => handleRejectOrder(order.id)} className="flex-1 justify-center bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-4 py-3 rounded-xl font-bold transition flex items-center gap-2">
                                       <XCircle size={18}/> Reject
                                     </button>
                                   </>
                                 )}
                                 <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOrder(order.id);
                                  }} 
                                  className="flex-none justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 p-3 rounded-xl font-bold transition flex items-center" 
                                  title="Delete Order"
                                >
                                   <Trash2 size={18}/>
                                 </button>
                               </div>
                             </div>
                           ))
                         )}
                       </div>
                    </div>
                  ) : activeAdminTab === 'users' ? (
                    <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                       <h3 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">User List</h3>
                       <div className="space-y-4">
                         {adminUsers.length === 0 ? (
                           <p className="text-slate-400 py-8 text-center border border-white/10 border-dashed rounded-xl">No users found.</p>
                         ) : (
                           adminUsers.map(u => (
                             <div key={u.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-800 border border-white/10 rounded-xl">
                               <div className="flex items-center gap-4">
                                 {u.photoURL ? (
                                   <img src={u.photoURL} alt={u.displayName || "User"} className="w-12 h-12 rounded-full border-2 border-slate-600" referrerPolicy="no-referrer" />
                                 ) : (
                                   <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                                     <UserIcon className="text-slate-400" />
                                   </div>
                                 )}
                                 <div>
                                   <h4 className="font-bold text-lg">{u.displayName || "Unknown User"} {u.role === 'admin' && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-1">Admin</span>} {u.role === 'suspended' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full ml-1">Suspended</span>}</h4>
                                   <p className="text-slate-400 text-sm">{u.email}</p>
                                   <p className="text-slate-500 text-xs mt-1">Last Login: {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'N/A'}</p>
                                 </div>
                               </div>
                               <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                                 {u.role !== 'admin' && (
                                   <button onClick={() => handleUpdateRole(u.uid, u.role || 'user', 'admin')} className="px-3 py-1 text-xs font-semibold rounded hover:bg-blue-500/20 text-blue-400 border border-blue-500/50 transition">Make Admin</button>
                                 )}
                                 {u.role === 'admin' && u.email !== 'motrafincc@gmail.com' && u.email !== 'motrafin14@gmail.com' && (
                                   <button onClick={() => handleUpdateRole(u.uid, u.role, 'user')} className="px-3 py-1 text-xs font-semibold rounded hover:bg-slate-700 text-slate-300 border border-slate-600 transition">Remove Admin</button>
                                 )}
                                 {u.role !== 'suspended' && !['motrafincc@gmail.com', 'motrafin14@gmail.com'].includes(u.email) && (
                                    <button onClick={() => handleUpdateRole(u.uid, u.role || 'user', 'suspended')} className="px-3 py-1 text-xs font-semibold rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 transition">Suspend</button>
                                 )}
                                 {u.role === 'suspended' && (
                                    <button onClick={() => handleUpdateRole(u.uid, u.role, 'user')} className="px-3 py-1 text-xs font-semibold rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 transition">Unsuspend</button>
                                 )}
                               </div>
                             </div>
                           ))
                         )}
                       </div>
                    </div>
                  ) : activeAdminTab === 'coupons' ? (
                    <div className="space-y-6">
                      <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        <h3 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Create New Coupon</h3>
                        <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Coupon Code</label>
                             <input required type="text" value={newCoupon.code || ""} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 uppercase" placeholder="e.g. EID50" />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Discount Type</label>
                             <select value={newCoupon.discountType || 'percentage'} onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value as any})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
                               <option value="percentage">Percentage (%)</option>
                               <option value="fixed">Fixed Amount (BDT)</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Discount Value</label>
                             <input required type="number" min="1" value={newCoupon.discountValue || 0} onChange={e => setNewCoupon({...newCoupon, discountValue: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g. 50" />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Expiration Date (Optional)</label>
                             <input type="datetime-local" value={newCoupon.expiresAt || ""} onChange={e => setNewCoupon({...newCoupon, expiresAt: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-blue-500" />
                           </div>
                           <div className="md:col-span-2 flex justify-end pt-2">
                             <button type="submit" disabled={isCreatingCoupon} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                               <Tag size={18}/> {isCreatingCoupon ? 'Creating...' : 'Create Coupon'}
                             </button>
                           </div>
                        </form>
                      </div>

                      <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                         <h3 className="text-xl font-bold mb-6 text-white border-b border-white/10 pb-4">Active Coupons</h3>
                         <div className="space-y-3">
                           {adminCoupons.length === 0 ? (
                             <p className="text-slate-400 py-4 text-center">No coupons created yet.</p>
                           ) : (
                             adminCoupons.map(coupon => (
                               <div key={coupon.id} className={`flex items-center justify-between p-4 border rounded-xl transition ${coupon.isActive ? 'bg-slate-800 border-white/10' : 'bg-slate-800/50 border-red-500/20 opacity-60'}`}>
                                 <div>
                                   <div className="flex items-center gap-3">
                                      <h4 className="font-bold text-xl text-orange-400 tracking-wider uppercase">{coupon.code}</h4>
                                      {!coupon.isActive && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded">Inactive</span>}
                                   </div>
                                   <p className="text-slate-300 text-sm mt-1">
                                     Discount: {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' BDT'}
                                   </p>
                                   {coupon.expiresAt && <p className="text-xs text-slate-500 mt-1">Expires: {new Date(coupon.expiresAt).toLocaleString()}</p>}
                                 </div>
                                 {coupon.isActive && (
                                   <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition" title="Deactivate Coupon">
                                     <Trash2 size={20} />
                                   </button>
                                 )}
                               </div>
                             ))
                           )}
                         </div>
                      </div>
                    </div>
                  ) : activeAdminTab === 'products' ? (
                     <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                        <h3 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Manage Product</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-6">
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Product Title</label>
                             <input required type="text" value={adminProduct.title || ""} onChange={e => setAdminProduct({...adminProduct, title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="Product name" />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Price (Base BDT)</label>
                             <input required type="number" min="0" value={adminProduct.price || 0} onChange={e => setAdminProduct({...adminProduct, price: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. 299" />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Download Link / Access URL</label>
                             <input required type="url" value={adminProduct.downloadLink || ""} onChange={e => setAdminProduct({...adminProduct, downloadLink: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500" placeholder="https://drive.google.com/..." />
                             <p className="text-xs text-slate-500 mt-2">Users will only see this link after their order changes to "approved".</p>
                           </div>
                           <div className="flex justify-end pt-4">
                             <button type="submit" disabled={isSavingProduct} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50">
                               <Save size={18}/> {isSavingProduct ? 'Saving...' : 'Save Product'}
                             </button>
                           </div>
                        </form>
                     </div>
                  ) : activeAdminTab === 'settings' ? (
                    <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                       <h3 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Landing Page Form Details</h3>
                       <form onSubmit={handleSaveSettings} className="space-y-6">
                         
                         <div className="grid md:grid-cols-2 gap-6">
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Hero Badge Text</label>
                             <input type="text" value={landingSettings.heroBadge || ''} onChange={e => setLandingSettings({...landingSettings, heroBadge: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Hero Title Primary</label>
                             <input type="text" value={landingSettings.heroTitle1 || ''} onChange={e => setLandingSettings({...landingSettings, heroTitle1: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Hero Title Highlight (Gradient)</label>
                             <input type="text" value={landingSettings.heroTitleHighlight || ''} onChange={e => setLandingSettings({...landingSettings, heroTitleHighlight: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Primary Button Text</label>
                             <input type="text" value={landingSettings.buttonText || ''} onChange={e => setLandingSettings({...landingSettings, buttonText: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
                           </div>
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-slate-400 mb-2">Hero Description</label>
                           <textarea value={landingSettings.heroDescription || ''} onChange={e => setLandingSettings({...landingSettings, heroDescription: e.target.value})} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
                         </div>

                         <div className="pt-4 border-t border-white/10">
                           <h4 className="text-lg font-semibold text-white mb-4">Media Settings (Uploads & Video)</h4>
                           <div className="grid md:grid-cols-2 gap-6">
                             <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">YouTube Video Link</label>
                               <input type="text" value={landingSettings.youtubeLink || ''} onChange={e => setLandingSettings({...landingSettings, youtubeLink: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="https://youtube.com/watch?v=..." />
                             </div>
                             <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">WhatsApp Number (e.g. 01XXXXXXXXX)</label>
                               <input type="text" value={landingSettings.whatsappNumber || ''} onChange={e => setLandingSettings({...landingSettings, whatsappNumber: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="01711000000" />
                             </div>
                             <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">Cover Image (Upload - Max 500KB)</label>
                               <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30" />
                               {landingSettings.coverImage && <img src={formatImageUrl(landingSettings.coverImage)} referrerPolicy="no-referrer" alt="Cover Preview" className="h-16 mt-2 rounded object-cover border border-white/10" />}
                             </div>
                           </div>
                         </div>

                         <div className="pt-4 border-t border-white/10">
                           <h4 className="text-lg font-semibold text-white mb-2">Book Preview Gallery (Image Links)</h4>
                            <p className="text-sm text-slate-400 mb-6 font-bold text-amber-300 italic">⚠️ Note: Imgur বা অন্য সাইট থেকে ছবি দিলে অবশ্যই "Direct Link" (যেটির শেষে .jpg বা .png আছে) সেটি ব্যবহার করবেন।</p>
                           <p className="text-sm text-slate-400 mb-6 font-medium text-slate-500">For best speed, upload preview images to Postimages, Imgur, or direct drive links and paste the 10 URLs below.</p>
                           <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
                             {landingSettings.previewImages?.map((url: string, i: number) => (
                               <div key={i}>
                                 <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-tighter">Image {i + 1}</label>
                                 <input 
                                   type="text" 
                                   value={url || ''} 
                                   onChange={e => {
                                     const newArr = [...landingSettings.previewImages];
                                     newArr[i] = e.target.value;
                                     setLandingSettings({...landingSettings, previewImages: newArr});
                                   }} 
                                   className="w-full bg-slate-800 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-blue-500 text-[10px]" 
                                   placeholder="https://..." 
                                 />
                               </div>
                             ))}
                           </div>
                         </div>

                          <div className="pt-4 border-t border-white/10">
                            <h4 className="text-lg font-semibold text-white mb-2 text-blue-400">Customer Chat Screenshots (Slider)</h4>
                            <p className="block text-sm font-medium text-slate-400 mb-6 font-bold text-amber-300 italic">⚠️ Note: Imgur বা অন্য সাইট থেকে ছবি দিলে অবশ্যই "Direct Link" (যেটির শেষে .jpg বা .png আছে) সেটি ব্যবহার করবেন।</p>
                            <label className="block text-sm font-medium text-slate-400 mb-6">এখানে গ্রাহকদের চ্যাট বা ফিডব্যাকের স্ক্রিনশট লিংক দিন। এগুলো স্লাইডার আকারে দেখাবে।</label>
                            <div className="grid md:grid-cols-2 gap-4">
                             {landingSettings.chatScreenshots?.map((url: string, i: number) => (
                               <div key={i}>
                                 <label className="block text-xs font-medium text-slate-500 mb-2">Screenshot {i + 1}</label>
                                 <input 
                                   type="text" 
                                   value={url || ''} 
                                   onChange={e => {
                                     const newArr = [...landingSettings.chatScreenshots];
                                     newArr[i] = e.target.value;
                                     setLandingSettings({...landingSettings, chatScreenshots: newArr});
                                   }} 
                                   className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm" 
                                   placeholder="https://i.imgur.com/..." 
                                 />
                               </div>
                             ))}
                           </div>
                         </div>


                          <div className="pt-4 border-t border-white/10">
                            <h4 className="text-lg font-semibold text-white mb-4">Features Section</h4>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <div className="space-y-4 p-4 bg-slate-800/40 rounded-xl border border-white/5">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Feature 1</label>
                                <input type="text" value={landingSettings.feature1Title || ''} onChange={e => setLandingSettings({...landingSettings, feature1Title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Title" />
                                <textarea value={landingSettings.feature1Desc || ''} onChange={e => setLandingSettings({...landingSettings, feature1Desc: e.target.value})} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-xs" placeholder="Description" />
                              </div>
                              <div className="space-y-4 p-4 bg-slate-800/40 rounded-xl border border-white/5">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Feature 2</label>
                                <input type="text" value={landingSettings.feature2Title || ''} onChange={e => setLandingSettings({...landingSettings, feature2Title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Title" />
                                <textarea value={landingSettings.feature2Desc || ''} onChange={e => setLandingSettings({...landingSettings, feature2Desc: e.target.value})} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-xs" placeholder="Description" />
                              </div>
                              <div className="space-y-4 p-4 bg-slate-800/40 rounded-xl border border-white/5">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Feature 3</label>
                                <input type="text" value={landingSettings.feature3Title || ''} onChange={e => setLandingSettings({...landingSettings, feature3Title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Title" />
                                <textarea value={landingSettings.feature3Desc || ''} onChange={e => setLandingSettings({...landingSettings, feature3Desc: e.target.value})} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-xs" placeholder="Description" />
                              </div>
                              <div className="space-y-4 p-4 bg-slate-800/40 rounded-xl border border-white/5">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Feature 4</label>
                                <input type="text" value={landingSettings.feature4Title || ''} onChange={e => setLandingSettings({...landingSettings, feature4Title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Title" />
                                <textarea value={landingSettings.feature4Desc || ''} onChange={e => setLandingSettings({...landingSettings, feature4Desc: e.target.value})} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-xs" placeholder="Description" />
                              </div>
                              <div className="space-y-4 p-4 bg-slate-800/40 rounded-xl border border-white/5">
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Feature 5</label>
                                <input type="text" value={landingSettings.feature5Title || ''} onChange={e => setLandingSettings({...landingSettings, feature5Title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm" placeholder="Title" />
                                <textarea value={landingSettings.feature5Desc || ''} onChange={e => setLandingSettings({...landingSettings, feature5Desc: e.target.value})} rows={3} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-xs" placeholder="Description" />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10">
                           <h4 className="text-lg font-semibold text-white mb-4">Pain Points Section (New Section)</h4>
                           <div className="space-y-4 mb-6">
                             <label className="block text-sm font-medium text-slate-400 mb-2">Pain Points Heading</label>
                             <input type="text" value={landingSettings.painPointHeading || ''} onChange={e => setLandingSettings({...landingSettings, painPointHeading: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="Heading..." />
                           </div>
                           <label className="block text-sm font-medium text-slate-400 mb-2">Pain Points (4 items)</label>
                           <div className="grid md:grid-cols-2 gap-4">
                             {landingSettings.painPoints?.map((point: string, i: number) => (
                               <textarea
                                 key={i}
                                 value={point || ""}
                                 onChange={e => {
                                   const newPoints = [...(landingSettings.painPoints || [])];
                                   newPoints[i] = e.target.value;
                                   setLandingSettings({...landingSettings, painPoints: newPoints});
                                 }}
                                 rows={3}
                                 className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                                 placeholder={`Pain Point ${i + 1}`}
                               />
                             ))}
                           </div>
                         </div>

                         <div className="pt-4 border-t border-white/10">
                           <h4 className="text-lg font-semibold text-white mb-4">FAQ Section</h4>
                           <div className="space-y-4">
                             {landingSettings.faqs?.map((faq: {q: string, a: string}, i: number) => (
                               <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 space-y-3">
                                 <input 
                                   type="text" 
                                   value={faq.q || ""} 
                                   onChange={e => {
                                     const newFaqs = [...(landingSettings.faqs || [])];
                                     newFaqs[i] = { ...newFaqs[i], q: e.target.value };
                                     setLandingSettings({...landingSettings, faqs: newFaqs});
                                   }} 
                                   className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 font-medium" 
                                   placeholder={`Question ${i + 1}`} 
                                 />
                                 <textarea 
                                   value={faq.a || ""} 
                                   onChange={e => {
                                     const newFaqs = [...(landingSettings.faqs || [])];
                                     newFaqs[i] = { ...newFaqs[i], a: e.target.value };
                                     setLandingSettings({...landingSettings, faqs: newFaqs});
                                   }} 
                                   rows={2} 
                                   className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm" 
                                   placeholder={`Answer ${i + 1}`} 
                                 />
                               </div>
                             ))}
                           </div>
                         </div>

                         <div className="flex justify-end pt-4">
                           <button type="submit" disabled={isSaving} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50">
                             <Save size={20} /> {isSaving ? 'Saving...' : 'Save Settings'}
                           </button>
                         </div>
                       </form>
                    </div>
                  ) : activeAdminTab === 'branding' ? (
                    <div className="p-8 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                       <h3 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Branding & Pages Configuration</h3>
                       <form onSubmit={handleSaveSettings} className="space-y-6">
                         
                         <div className="grid md:grid-cols-2 gap-6">
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Custom Logo Image (Optional)</label>
                             <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30" />
                             {landingSettings.logoUrl && <img src={formatImageUrl(landingSettings.logoUrl)} referrerPolicy="no-referrer" alt="Logo Preview" className="h-10 mt-2 rounded object-contain border border-white/10" />}
                           </div>
                           <div>
                             <label className="block text-sm font-medium text-slate-400 mb-2">Bengali Font</label>
                             <select className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" value={landingSettings.bengaliFont || "Hind Siliguri"} onChange={(e) => setLandingSettings({...landingSettings, bengaliFont: e.target.value})}>
                               <option value="Hind Siliguri">Hind Siliguri (Default)</option>
                               <option value="Noto Sans Bengali">Noto Sans Bengali</option>
                               <option value="Anek Bangla">Anek Bangla</option>
                               <option value="Galada">Galada</option>
                               <option value="Mina">Mina</option>
                               <option value="Tiro Bangla">Tiro Bangla</option>
                             </select>
                           </div>
                         </div>
                         
                         <div className="pt-4 border-t border-white/10 space-y-6">
                            <h4 className="text-lg font-semibold text-white mb-2">Integrations</h4>
                            <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">Meta Pixel ID</label>
                               <input type="text" value={landingSettings.metaPixelId || ""} onChange={e => setLandingSettings({...landingSettings, metaPixelId: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="e.g., 123456789012345" />
                               <p className="text-xs text-slate-500 mt-2">Enter your Meta Pixel ID to enable tracking. It will be loaded on the page automatically.</p>
                            </div>
                         </div>
                         
                         <div className="pt-4 border-t border-white/10 space-y-6">
                            <h4 className="text-lg font-semibold text-white mb-2">Footer Pages Content</h4>
                            
                            <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">About Us (আমাদের সম্পর্কে)</label>
                               <textarea value={landingSettings.aboutUsText || ""} onChange={e => setLandingSettings({...landingSettings, aboutUsText: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white h-32 focus:outline-none focus:border-blue-500" placeholder="Type about us content..."></textarea>
                            </div>
                            
                            <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">Privacy Policy (প্রাইভেসি পলিসি)</label>
                               <textarea value={landingSettings.privacyPolicyText || ""} onChange={e => setLandingSettings({...landingSettings, privacyPolicyText: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white h-32 focus:outline-none focus:border-blue-500" placeholder="Type privacy policy..."></textarea>
                            </div>
                            
                            <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">Terms & Conditions (শর্তাবলী)</label>
                               <textarea value={landingSettings.termsConditionsText || ""} onChange={e => setLandingSettings({...landingSettings, termsConditionsText: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white h-32 focus:outline-none focus:border-blue-500" placeholder="Type terms and conditions..."></textarea>
                            </div>
                            
                            <div>
                               <label className="block text-sm font-medium text-slate-400 mb-2">Refund Policy (রিফান্ড পলিসি)</label>
                               <textarea value={landingSettings.refundPolicyText || ""} onChange={e => setLandingSettings({...landingSettings, refundPolicyText: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white h-32 focus:outline-none focus:border-blue-500" placeholder="Type refund policy..."></textarea>
                            </div>
                         </div>

                         <div className="flex justify-end pt-4">
                           <button type="submit" disabled={isSaving} className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50">
                             <Save size={20} /> {isSaving ? 'Saving...' : 'Save Branding'}
                           </button>
                         </div>
                       </form>
                    </div>
                  ) : null}
               </motion.div>
            ) : userRole === 'suspended' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 flex flex-col items-center justify-center min-h-[50vh]">
                 <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-xl text-center">
                    <h2 className="text-3xl font-bold text-red-500 mb-4">Account Suspended</h2>
                    <p className="text-slate-300">Your account has been suspended by the administrator. You can no longer make new purchases or access previously purchased materials.</p>
                 </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                 <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Client <span className="text-blue-400">Dashboard</span></h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-3xl">
                     <UserIcon className="mb-4 text-purple-400" size={32}/> 
                     <h3 className="text-xl font-bold text-white">Profile</h3>
                     <p className="text-slate-400 text-sm mt-1">{user.email}</p>
                   </div>
                   <div className="p-6 md:p-8 bg-slate-900 border border-white/10 rounded-3xl">
                     <BookOpen className="mb-4 text-amber-400" size={32}/> 
                     <h3 className="text-xl font-bold text-white">Purchase History</h3>
                     <p className="text-slate-400 text-sm mt-1">{userOrders.filter(o => o.status === 'approved').length} completed courses</p>
                   </div>
                 </div>

                 <div className="mt-8">
                   <h3 className="text-2xl font-bold text-white mb-4">My Access / Downloads</h3>
                   <div className="space-y-4">
                     {userOrders.length === 0 ? (
                       <div className="p-8 border border-white/5 bg-white/5 rounded-3xl text-center text-slate-500">
                         No orders found yet.
                       </div>
                     ) : (
                       userOrders.map(order => (
                         <div key={order.id} className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                             <div>
                               <h4 className="font-bold text-lg text-white">Order: {order.productTitle || adminProduct.title}</h4>
                               <p className="text-sm text-slate-400 mt-1">Transaction: {order.transactionId}</p>
                             </div>
                             <div>
                               <span className={`px-4 py-2 text-sm font-bold rounded-full ${order.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                 {order.status === 'approved' ? 'Active Access' : 'Pending Verification'}
                               </span>
                             </div>
                           </div>
                           
                           {order.status === 'approved' ? (
                             <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                               <div>
                                 <p className="text-blue-200 font-medium whitespace-break-spaces">আপনার অর্ডারটি এপ্রুভ হয়েছে! নিচের বাটন থেকে প্রোডাক্ট এক্সেস করতে পারবেন।</p>
                               </div>
                               <button 
                                 onClick={async () => {
                                   try {
                                     await updateDoc(doc(db, 'products', adminProduct.id), {
                                       downloadsCount: increment(1)
                                     });
                                   } catch(e) {
                                     console.error(e);
                                   }
                                   window.open(adminProduct.downloadLink, "_blank");
                                 }}
                                 className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 shrink-0">
                                 <Link size={18}/> Access/Download
                               </button>
                             </div>
                           ) : (
                             <p className="text-slate-400 text-sm italic">
                               We are reviewing your payment. Please wait for approval to access your items here.
                             </p>
                           )}
                         </div>
                       ))
                     )}
                   </div>
                 </div>
              </motion.div>
            )}
          </main>
        ) : (
          <main className="w-full max-w-7xl mx-auto px-6 py-12 lg:py-24">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-24">
              
              {/* Product Info / Typography block */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.2 }
                  }
                }}
                className="lg:col-span-7 space-y-8"
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="inline-flex py-1 px-3 border border-white/10 bg-white/5 backdrop-blur-md rounded-full text-sm font-medium tracking-wide text-slate-300">
                  {landingSettings.heroBadge || ''}
                </motion.div>
                
                <motion.h1 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
                  {landingSettings.heroTitle1 || ''} <motion.span 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-[length:200%_auto] inline-block"
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >{landingSettings.heroTitleHighlight || ''}</motion.span>
                </motion.h1>
                
                {getYoutubeEmbedUrl(landingSettings.youtubeLink) && (
                  <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-[0_0_50px_rgba(56,189,248,0.15)] relative group">
                    <iframe 
                      className="w-full h-full object-cover relative z-10" 
                      src={getYoutubeEmbedUrl(landingSettings.youtubeLink) as string} 
                      title="YouTube Video" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </motion.div>
                )}
                
                <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-lg lg:text-xl text-slate-400 leading-relaxed max-w-2xl whitespace-pre-wrap">
                  {landingSettings.heroDescription || ''}
                </motion.p>

                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <motion.button 
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: ["0px 0px 0px rgba(56,189,248,0)", "0px 0px 20px rgba(56,189,248,0.6)", "0px 0px 0px rgba(56,189,248,0)"]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (userRole === 'suspended') {
                          alert('Your account is suspended.');
                          return;
                        }
                        setIsCheckoutOpen(true);
                      }} 
                      className="bg-white text-slate-950 px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-200 transition-all duration-300 relative overflow-hidden group border-2 border-transparent"
                    >
                      <span className="relative z-10">{landingSettings.buttonText || ''}</span>
                    </motion.button>
                    {landingSettings.whatsappNumber && (
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={`https://wa.me/${landingSettings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-colors shrink-0"
                      >
                        <MessageCircle size={28} />
                      </motion.a>
                    )}
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl relative overflow-hidden group cursor-default"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 w-[200%]"></div>
                    <div className="bg-emerald-500/20 p-2 rounded-full relative z-10 shrink-0">
                      <CheckCircle className="text-emerald-400" size={24} />
                    </div>
                    <div className="relative z-10">
                      <p className="font-bold text-emerald-400 text-base">১০০% মানি-ব্যাক গ্যারান্টি</p>
                      <p className="text-emerald-200/70 text-xs font-medium uppercase tracking-wider mt-0.5">ঝুঁকিমুক্ত সিদ্ধান্ত নিন</p>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Product Preview / Glass Card */}
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                 transition={{ 
                   opacity: { duration: 0.8, delay: 0.2 },
                   scale: { duration: 0.8, delay: 0.2 },
                   y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                 }}
                 className="lg:col-span-5 relative"
              >
                <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
                  {/* Decorative blur elements behind the card */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                  
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-2xl flex flex-col justify-between overflow-hidden">
                    {landingSettings.coverImage ? (
                      <div className="absolute inset-0 z-0">
                        <img src={formatImageUrl(landingSettings.coverImage)} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Book Cover" />
                      </div>
                    ) : (
                      <>
                        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none z-0">
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 blur-2xl"></div>
                        </div>
                        
                        <div className="z-10">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-2xl backdrop-blur-md border border-white/5">
                            📖
                          </div>
                          <h3 className="text-3xl font-bold text-white leading-tight mb-2">Income Scale<br/><span className="text-blue-400">with Unique Ideas</span></h3>
                          <p className="text-slate-400 text-sm">ডিজিটাল ই-বুক + ভিডিও কোর্স</p>
                        </div>

                        <div className="z-10 space-y-4">
                          {/* Simulating content / skeleton */}
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-white/10 rounded-full"></div>
                            <div className="h-2 w-4/5 bg-white/10 rounded-full"></div>
                            <div className="h-2 w-3/4 bg-white/10 rounded-full"></div>
                          </div>
                          
                          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className="flex -space-x-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">SM</div>
                              <div className="w-10 h-10 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">RA</div>
                              <div className="w-10 h-10 rounded-full bg-purple-500 border-2 border-slate-900 flex items-center justify-center text-xs font-bold">KH</div>
                            </div>
                            <div className="text-right">
                              <div className="text-amber-400 font-bold text-sm">৪.৯/৫</div>
                              <div className="text-xs text-slate-400">৮৫০+ রিভিউ</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Pain Points Section */}
            <motion.div 
               initial="hidden"
               whileInView="visible"
               viewport={{ once: true, margin: "-100px" }}
               variants={{
                 visible: { transition: { staggerChildren: 0.15 } },
                 hidden: {}
               }}
               className="py-16 md:py-20 border-t border-white/10"
            >
              <motion.div 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
                className="text-center mb-12"
              >
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight max-w-2xl mx-auto">{landingSettings.painPointHeading || ''}</h3>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              </motion.div>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {landingSettings.painPoints?.map((point: string, i: number) => (
                  <motion.div 
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 30 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                    }}
                    className="bg-slate-800/30 backdrop-blur-sm border border-white/5 hover:border-white/10 rounded-2xl p-6 relative group overflow-hidden transition-colors"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-blue-500/10 transition-all"></div>
                    <div className="flex gap-4 relative z-10">
                      <div className="shrink-0 mt-1 text-slate-500">
                        <MessageCircle className="w-6 h-6 opacity-50" />
                      </div>
                      <p className="text-slate-300 text-lg leading-relaxed font-medium">"{point}"</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick CTA after features */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="py-10 flex justify-center"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ boxShadow: ["0 0 0px rgba(59,130,246,0)", "0 0 20px rgba(59,130,246,0.5)", "0 0 0px rgba(59,130,246,0)"] }}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={() => {
                  if (userRole === 'suspended') {
                    alert('Your account is suspended.');
                    return;
                  }
                  setIsCheckoutOpen(true);
                }} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-bold text-xl transition shadow-lg flex items-center gap-2"
              >
                পড়া শুরু করুন এখনই <ArrowRight size={20} />
              </motion.button>
            </motion.div>

            {/* Why This Book Section */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="py-20 border-t border-white/10"
            >
              <div className="text-center mb-16">
                <div className="inline-flex py-1 px-3 mb-4 border border-white/10 bg-white/5 backdrop-blur-md rounded-full text-sm font-medium tracking-wide text-emerald-300">
                  Why this book?
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white">কেন এই বইটি <span className="text-blue-400">আপনার জন্য?</span></h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                {[
                  {
                    icon: <Shield className="w-8 h-8 text-emerald-400" />,
                    title: landingSettings.feature1Title || "১০০% পেমেন্ট রিফান্ড গ্যারান্টি",
                    desc: landingSettings.feature1Desc || "আপনার কাছে যদি পড়ে মনেহয় ভালো লাগেনি তাহলে রিফান্ড আস্ক করতে পারেন 36 ঘন্টার মধ্যে।"
                  },
                  {
                    icon: <Target className="w-8 h-8 text-blue-400" />,
                    title: landingSettings.feature2Title || "প্র্যাক্টিক্যাল গাইডলাইন",
                    desc: landingSettings.feature2Desc || "এখানে শুধু তাত্ত্বিক বুলি নেই। একদম বাছাই করা এমন সব ইউনিক ব্যবসার আইডিয়া দেওয়া হয়েছে, যা আপনি হয়তো আগে ভাবেননি।"
                  },
                  {
                    icon: <Video className="w-8 h-8 text-purple-400" />,
                    title: landingSettings.feature3Title || "ফ্রি ভিডিও সাপোর্ট",
                    desc: landingSettings.feature3Desc || "বইয়ের সাথে পাচ্ছেন গুরুত্বপূর্ণ টপিকের উপর বিস্তারিত ভিডিও গাইডলাইন সম্পূর্ণ বিনামূল্যে।"
                  },
                  {
                    icon: <Infinity className="w-8 h-8 text-amber-400" />,
                    title: landingSettings.feature4Title || "লাইফটাইম এক্সেস",
                    desc: landingSettings.feature4Desc || "একবার এনরোল করলেই ড্যাশবোর্ড থেকে আজীবন এক্সেস এবং ভবিষ্যতের সব আপডেট ফ্রি।"
                  },
                  {
                    icon: <Users className="w-8 h-8 text-pink-400" />,
                    title: landingSettings.feature5Title || "প্রাইভেট কমিউনিটি",
                    desc: landingSettings.feature5Desc || "আমাদের এক্সক্লুসিভ মেম্বারশিপ গ্রুপে যুক্ত হওয়ার সুযোগ এবং মেন্টরদের থেকে সরাসরি সাপোর্ট।"
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="p-6 md:p-8 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl hover:bg-slate-800 transition-colors group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-20 transition duration-500 pointer-events-none">
                       <div className="w-24 h-24 rounded-full bg-blue-400 blur-2xl"></div>
                    </div>
                    <motion.div 
                      className="mb-4"
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: i * 0.1 + 0.3 
                      }}
                      whileHover={{ 
                        rotate: [0, -10, 10, -10, 0],
                        scale: 1.1,
                        transition: { duration: 0.5 }
                      }}
                    >
                      {item.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Photo Previews */}
            {(() => {
              const validPreviews = landingSettings.previewImages?.filter(url => url && url.trim() !== '') || [];
              if (validPreviews.length === 0) return null;
              
              return (
                <motion.div 
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.8 }}
                   className="py-16 border-t border-white/10 text-center relative"
                >
                  <div className="inline-flex py-1 px-3 mb-6 border border-white/10 bg-white/5 backdrop-blur-md rounded-full text-sm font-medium tracking-wide text-blue-300">
                    ভিতরের কিছু পাতা
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-12">বইয়ের <span className="text-emerald-400">প্রিভিউ</span></h2>
                  
                  <div className="relative group">
                    <div ref={galleryRef} className="flex gap-6 overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {validPreviews.map((url, index) => (
                        <motion.div 
                          key={index} 
                          variants={{
                            hidden: { opacity: 0, x: 50 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay: index * 0.1 } }
                          }}
                          className="min-w-[85vw] md:min-w-[400px] snap-center shrink-0 p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                          <img 
                            src={formatImageUrl(url)} 
                            referrerPolicy="no-referrer" 
                            className="w-full h-[500px] md:h-[600px] rounded-2xl object-cover hover:scale-[1.02] transition duration-500 bg-slate-800" 
                            alt={`Book Page Preview ${index + 1}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/400x600/1e293b/4ade80?text=Invalid+Image+Link";
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Animated Right Arrow Box Hint */}
                    {validPreviews.length > 1 && (
                      <button onClick={handleScrollGallery} aria-label="Next Preview" className="absolute right-2 top-1/2 -translate-y-1/2 drop-shadow-2xl flex z-10 cursor-pointer hover:scale-105 active:scale-95 transition-transform appearance-none">
                        <motion.div
                          animate={{ x: [0, 10, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                        >
                          <ArrowRight size={24} className="text-emerald-400" />
                        </motion.div>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })()}

            {/* Testimonials (Chat Screenshot Slider) */}
            <motion.div 
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               className="py-20 border-t border-white/10"
            >
              <div className="text-center mb-10">
                <div className="inline-flex py-1 px-3 mb-4 border border-white/10 bg-white/5 backdrop-blur-md rounded-full text-sm font-medium tracking-wide text-emerald-300">
                  সফলদের গল্প
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">কি বলছেন আমাদের <span className="text-blue-400">পাঠকরা?</span></h2>
                <p className="text-slate-400 max-w-2xl mx-auto">আমাদের বই পড়ে গত কয়েক মাসে সফল হওয়া কিছু উদ্যোক্তার কথোপকথন দেখে নিন।</p>
              </div>

              {landingSettings.chatScreenshots?.some((url: string) => url) ? (
                <ChatScreenshotSlider images={landingSettings.chatScreenshots.filter((url: string) => url)} />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                  {[
                    {
                      name: "আরিয়ান আহমেদ",
                      role: "উদ্যোক্তা",
                      text: "এই বইটি পড়ার পর আমি আমার ৩য় সাইড হাস্টল শুরু করেছি যা এখন আমার মূল আয়ের উৎস। প্রতিটি আইডিয়া খুবই প্র্যাকটিক্যাল।",
                      rating: 5,
                      avatar: "AA"
                    },
                    {
                      name: "নুসরাত জাহান",
                      role: "ফ্রিল্যান্সার",
                      text: "ভিডিও গাইডগুলো অনেক সহায়ক। শুধু আইডিয়া না, কিভাবে শুরু করতে হবে তাও পরিষ্কার করে বলা আছে। সেরা ইনভেস্টমেন্ট!",
                      rating: 5,
                      avatar: "NJ"
                    },
                    {
                      name: "কৌশিক রহমান",
                      role: "চাকরিজীবী",
                      text: "অফিসের পাশাপাশি ছোট কিছু শুরু করার স্বপ্ন ছিল। বইয়ের 'লো ইনভেস্টメント' সেকশনটা আমার জন্য গেম চেঞ্জার ছিল।",
                      rating: 5,
                      avatar: "KR"
                    }
                  ].map((t, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="p-8 bg-white/5 border border-white/10 rounded-3xl relative group hover:bg-white/[0.08] transition-colors"
                    >
                      <div className="flex text-amber-400 mb-6 font-bold text-lg">
                        {"★".repeat(t.rating)}
                      </div>
                      <p className="text-slate-300 leading-relaxed mb-8 italic">"{t.text}"</p>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
                          {t.avatar}
                        </div>
                        <div>
                          <h5 className="text-white font-bold">{t.name}</h5>
                          <p className="text-slate-500 text-sm">{t.role}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* FAQ Section */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.8 }}
               className="py-16 border-t border-white/10"
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-12">সচরাচর জিজ্ঞাসিত <span className="text-blue-400">প্রশ্নসমূহ</span></h2>
              <div className="max-w-3xl mx-auto space-y-4 px-4">
                {landingSettings.faqs?.map((faq: {q: string, a: string}, i: number) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </motion.div>

            {/* Final CTA Section */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="py-24 text-center border-t border-white/10 relative"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">আপনার সফলতার যাত্রা <br/><motion.span 
                 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-[length:200%_auto] inline-block"
                 animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >আজই শুরু হোক!</motion.span></h2>
              <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">সঠিক গাইডলাইন এবং ইউনিক আইডিয়া ছাড়া বড় কিছু গড়া কঠিন। আমরা আপনার জন্য সেই পথকে সহজ করেছি।</p>
              
              <div className="flex flex-col items-center gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: ["0px 0px 0px rgba(56,189,248,0)", "0px 0px 20px rgba(56,189,248,0.6)", "0px 0px 0px rgba(56,189,248,0)"]
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  onClick={() => {
                    if (userRole === 'suspended') {
                      alert('Your account is suspended.');
                      return;
                    }
                    setIsCheckoutOpen(true);
                  }} 
                  className="bg-white text-slate-950 px-12 py-5 rounded-full font-black text-2xl transition-all duration-300 relative overflow-hidden group border-2 border-transparent z-10 flex items-center justify-center gap-3"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">বেস্ট সেলিং বইটি কিনুন <CheckCircle size={28} /></span>
                </motion.button>
                <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
                  <Check size={16} /> ১০০০+ পাঠক অলরেডি শুরু করেছেন
                </p>
              </div>
            </motion.div>

          </main>
        )}
        <Footer landingSettings={landingSettings} onOpenPage={setActivePageModal} />
      </div>

       {/* Page Content Modal */}
       <AnimatePresence>
        {activePageModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
              onClick={() => setActivePageModal(null)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl relative z-10"
            >
              <button 
                onClick={() => setActivePageModal(null)} 
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">
                {activePageModal === 'about' ? 'আমাদের সম্পর্কে' : activePageModal === 'privacy' ? 'প্রাইভেসি পলিসি' : activePageModal === 'refund' ? 'রিফান্ড পলিসি' : 'শর্তাবলী'}
              </h2>
              
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {activePageModal === 'about' ? (landingSettings.aboutUsText || '') : activePageModal === 'privacy' ? (landingSettings.privacyPolicyText || '') : activePageModal === 'refund' ? (landingSettings.refundPolicyText || '') : (landingSettings.termsConditionsText || '')}
              </div>
            </motion.div>
          </div>
        )}
       </AnimatePresence>

       {/* Login Modal */}
       <AnimatePresence>
        {isLoginOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 text-white text-center">
                {isSignUp ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন"}
              </h2>
              
              <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                    placeholder="Enter your password"
                    minLength={6}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 py-3 rounded-lg font-bold text-white hover:bg-emerald-600 transition"
                >
                  {isSignUp ? "Sign Up" : "Login"}
                </button>
              </form>
              
              <div className="relative flex items-center py-5">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">অথবা</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <button 
                type="button"
                onClick={handleLogin} 
                className="w-full bg-white text-slate-900 py-3 rounded-lg font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Google দিয়ে {isSignUp ? "সাইন আপ" : "লগইন"}
              </button>
              
              <div className="mt-6 text-center text-sm text-slate-400">
                {isSignUp ? "ইতিমধ্যে অ্যাকাউন্ট আছে? " : "অ্যাকাউন্ট নেই? "}
                <button 
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-blue-400 hover:text-blue-300 hover:underline transition"
                >
                  {isSignUp ? "লগইন করুন" : "সাইন আপ করুন"}
                </button>
              </div>

              <button 
                onClick={() => setIsLoginOpen(false)} 
                className="w-full mt-6 text-slate-500 text-sm hover:text-white transition"
              >
                বন্ধ করুন
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special Offer Popup */}
      <AnimatePresence>
        {showOfferPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => { 
              if (e.target === e.currentTarget) {
                setShowOfferPopup(false);
              }
            }}
          >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
              >
                <button 
                  type="button"
                  onClick={() => {
                    setShowOfferPopup(false);
                  }} 
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 bg-slate-100/50 hover:bg-slate-200 rounded-full z-20 transition"
                >
                  <X size={20} />
                </button>
                
                <div className="overflow-y-auto custom-scrollbar">
                  <div className="p-6 md:p-8 text-center bg-white">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-amber-400 bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 md:mb-6">
                      <span className="text-2xl md:text-3xl font-bold">!</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3">একটু দাঁড়াবেন!</h3>
                    <p className="text-slate-600 font-medium text-sm md:text-base">হয়তো আপনি আপনার ক্যারিয়ারের সবচেয়ে সেরা সুযোগটি মিস করতে চলেছেন।</p>
                  </div>
                  
                  <div className="bg-slate-900 p-6 md:p-8 text-white rounded-b-3xl">
                <h4 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <span className="text-emerald-400">🎁</span> আপনার জন্য স্পেশাল গিফট
                </h4>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  যেহেতু আপনি আমাদের পেইজটি এতক্ষণ সময় নিয়ে ভিজিট করেছেন, আপনার জন্য রয়েছে একটি সিক্রেট অফার!
                </p>
                
                <div className="border border-dashed border-emerald-500/50 rounded-2xl p-6 text-center mb-6 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 px-3 text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span> LIMITED OFFER
                  </div>
                  <div className="font-mono text-2xl md:text-3xl font-bold tracking-wider text-white mb-4 mt-2 flex items-center justify-center gap-3">
                    Save5%
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('Save5%');
                        alert('কুপন কোড কপি করা হয়েছে!');
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-blue-400"
                      title="Copy Coupon"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="text-emerald-400 font-bold text-xl">৫% ছাড়ের কুপন</span>
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 font-bold text-sm animate-pulse">
                      অফারটি শেষ হবে: {formatTimer(offerTimeLeft)}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setShowOfferPopup(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  অফারটি লুফে নিন <ArrowRight size={20} />
                </button>
                <div className="text-center mt-4">
                  <button 
                     onClick={() => {
                       setShowOfferPopup(false);
                     }}
                     className="text-slate-400 hover:text-white text-sm transition"
                  >
                    একটু পড়ে দেখুন
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

       {/* Checkout Modal */}
       <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-4 pt-10 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setIsCheckoutOpen(false); }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl my-8 relative z-10"
            >
              <button 
                type="button"
                onClick={() => setIsCheckoutOpen(false)} 
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full z-20"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">সাফল্যের পথে আরও এক ধাপ এগিয়ে!</h2>
              
              <div className="flex items-center mb-8 relative px-4">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-800 rounded-full"></div>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full transition-all duration-500" style={{ width: checkoutStep === 1 ? '0%' : checkoutStep === 2 ? '50%' : '100%' }}></div>
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${checkoutStep >= 1 ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400'}`}>1</div>
                <div className="flex-1"></div>
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 delay-100 ${checkoutStep >= 2 ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400'}`}>2</div>
                <div className="flex-1"></div>
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 delay-200 ${checkoutStep >= 3 ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-400'}`}><Check size={16} /></div>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                 
                 {checkoutStep === 1 && (
                   <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                     <div>
                       <label className="block text-sm font-medium text-slate-400 mb-2">নাম <span className="text-red-500">*</span></label>
                       <input required type="text" value={checkoutForm.name || ""} onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="আপনার পুরো নাম" />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-slate-400 mb-2">ইমেইল <span className="text-red-500">*</span></label>
                       <input required type="email" value={checkoutForm.email || ""} onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="example@gmail.com" />
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-slate-400 mb-2">ফোন নাম্বার <span className="text-red-500">*</span></label>
                       <input required type="text" value={checkoutForm.phone || ""} onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" placeholder="01XXXXXXXXX" />
                     </div>
                     
                     <button type="button" onClick={() => {
                       if (!checkoutForm.name || !checkoutForm.email || !checkoutForm.phone) {
                         alert('অনুগ্রহ করে আপনার নাম, ইমেইল এবং ফোন নাম্বার প্রদান করুন।');
                         return;
                       }
                       setCheckoutStep(2);
                     }} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition">
                       পরবর্তী ধাপ <ArrowRight size={20} />
                     </button>
                   </motion.div>
                 )}

                 {checkoutStep === 2 && (
                   <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                     <div className="pt-2">
                       <h3 className="font-semibold text-lg mb-4">Payment</h3>
                   <div className="flex gap-4 mb-4">
                     <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${checkoutForm.paymentMethod === 'Bkash' ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-slate-800'}`}>
                        <input type="radio" name="payment" value="Bkash" checked={checkoutForm.paymentMethod === 'Bkash'} onChange={() => setCheckoutForm({...checkoutForm, paymentMethod: 'Bkash'})} className="accent-pink-500" />
                        <span className="font-bold text-pink-500 tracking-wide">bKash</span>
                     </label>
                     <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${checkoutForm.paymentMethod === 'Nagad' ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 bg-slate-800'}`}>
                        <input type="radio" name="payment" value="Nagad" checked={checkoutForm.paymentMethod === 'Nagad'} onChange={() => setCheckoutForm({...checkoutForm, paymentMethod: 'Nagad'})} className="accent-orange-500" />
                        <span className="font-bold text-orange-500 tracking-wide">Nagad</span>
                     </label>
                   </div>
                   
                   <div className="bg-white text-slate-900 p-6 rounded-xl space-y-4 shadow-inner">
                      <div className="flex flex-col gap-1 pb-4 border-b border-slate-200">
                         {appliedCoupon ? (
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex justify-between items-center">
                              <div>
                                <span className="text-emerald-700 font-bold text-sm bg-emerald-200 px-2 py-0.5 rounded mr-2">{appliedCoupon.code}</span>
                                <span className="text-emerald-600 text-sm">Applied! (-{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `${appliedCoupon.discountValue}৳`})</span>
                              </div>
                              <button type="button" onClick={() => setAppliedCoupon(null)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                            </div>
                         ) : (
                            <div>
                               <label className="block text-xs font-bold text-slate-900 mb-1">Have a Coupon?</label>
                               <div className="flex gap-2">
                                  <input type="text" value={couponCode || ""} onChange={e => setCouponCode(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-orange-500 text-sm uppercase" placeholder="Enter code" />
                                  <button type="button" onClick={handleApplyCoupon} disabled={isApplyingCoupon} className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-700 disabled:opacity-50">Apply</button>
                               </div>
                               {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                               {couponSuccess && <p className="text-emerald-600 text-xs mt-1">{couponSuccess}</p>}
                            </div>
                         )}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-medium text-slate-600">Total to pay:</span>
                        <div className="text-right">
                          {appliedCoupon && <span className="text-slate-400 line-through text-sm mr-2">{basePrice} BDT</span>}
                          <strong className="text-emerald-600 text-xl">{finalPrice} BDT</strong>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">
                        বিকাশ/ নগদ দিয়ে সেন্ড মানি করুন। আপনার বিকাশ মোবাইল নম্বর এবং ট্রানজেকশন আইডি লিখুন।
                      </p>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-sm">Account Type: <strong className="text-slate-800">Personal</strong></span>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                           Account Number: 
                           <span className="bg-sky-200 text-sky-900 font-bold px-3 py-1.5 rounded select-all cursor-text text-base flex items-center gap-2 transition">
                             01960762225
                             <button type="button" onClick={handleCopyPhone} className="hover:bg-black/10 p-1 rounded transition ml-1" title="Copy Number">
                               {isCopied ? <Check size={16} className="text-emerald-600"/> : <Copy size={16} />}
                             </button>
                           </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div>
                           <label className="block text-xs font-bold text-slate-900 mb-1">{checkoutForm.paymentMethod} Phone Number *</label>
                           <input required type="text" value={checkoutForm.senderAccount || ""} onChange={e => setCheckoutForm({...checkoutForm, senderAccount: e.target.value})} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm" placeholder="যে নাম্বার থেকে টাকা পাঠিয়েছেন" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-900 mb-1">{checkoutForm.paymentMethod} Transaction ID *</label>
                           <input required type="text" value={checkoutForm.transactionId || ""} onChange={e => setCheckoutForm({...checkoutForm, transactionId: e.target.value})} className="w-full bg-white border border-slate-300 rounded p-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm uppercase" placeholder="Transaction ID" />
                        </div>
                      </div>
                   </div>
                 </div>

                 <div className="flex gap-4">
                   <button type="button" onClick={() => setCheckoutStep(1)} className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center transition">
                     Back
                   </button>
                   <button type="submit" disabled={isSubmittingOrder} className="w-2/3 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition">
                      {isSubmittingOrder ? 'Processing...' : 'Confirm Order'}
                   </button>
                 </div>

                 <p className="text-center text-slate-400 text-sm pt-2 hover:text-white transition cursor-pointer">
                   কিভাবে অর্ডার করবেন জানতে ভিডিওটি দেখুন
                 </p>
               </motion.div>
                 )}

                 {checkoutStep === 3 && (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center space-y-6 pt-4">
                     <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 relative">
                       <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping"></div>
                       <CheckCircle size={40} />
                     </div>
                     
                     <div className="space-y-2">
                       <h3 className="text-3xl font-black text-white">অর্ডার সফল!</h3>
                       <p className="text-slate-400 text-sm leading-relaxed">
                         আপনার অর্ডারটি সফলভাবে জমা দেওয়া হয়েছে! আমরা যাচাই করে দ্রুত অ্যাপ্রুভ করব।
                       </p>
                     </div>

                     {!user ? (
                       <div className="bg-slate-800 border border-white/10 p-6 rounded-2xl w-full mt-4">
                         <h4 className="text-lg font-bold text-white mb-2">প্রোফাইল সেভ করুন</h4>
                         <p className="text-slate-400 text-sm mb-6">
                           আপনি গেস্ট হিসেবে অর্ডার করেছেন। অর্ডারটি ট্র্যাক করতে এবং পরবর্তীতে প্রোডাক্টটি ডাউনলোড করতে নিচের বাটনে ক্লিক করে ইমেইল দিয়ে কানেক্ট করুন।
                         </p>
                         <button type="button" onClick={handleLogin} className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-200 transition flex items-center justify-center gap-2">
                           Google দিয়ে কানেক্ট করুন
                         </button>
                       </div>
                     ) : (
                       <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl w-full mt-4 flex items-center gap-3">
                         <CheckCircle size={24} className="text-emerald-500 shrink-0" />
                         <p className="text-emerald-500 text-sm font-medium text-left">
                           অর্ডারটি আপনার প্রোফাইলের সাথে যুক্ত হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে ড্যাশবোর্ড থেকে ডাউনলোড করতে পারবেন।
                         </p>
                       </div>
                     )}

                     <button type="button" onClick={() => {
                        setIsCheckoutOpen(false);
                        if (user) {
                          setShowDashboard(true);
                        }
                     }} className="mt-4 text-slate-400 hover:text-white underline decoration-dashed underline-offset-4 text-sm font-medium transition">
                       {user ? 'ড্যাশবোর্ডে ফিরে যান' : 'মূল পাতায় ফিরে যান'}
                     </button>
                   </motion.div>
                 )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 z-[90] bg-slate-800 text-white p-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:bg-slate-700 transition flex items-center justify-center border border-white/10 group"
            aria-label="Scroll to top"
          >
            <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <a
        href="https://wa.me/8801910524726"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[90] bg-[#25D366] text-white p-4 rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}


