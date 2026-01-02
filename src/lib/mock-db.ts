
import { PlaceHolderImages } from '@/lib/placeholder-images';

type ChangeListener = () => void;

class MockDatabase {
    private listeners: ChangeListener[] = [];

    // Initial Data
    public users = [
        { id: 'user-1', uid: 'uid-1', displayName: 'Admin User', email: 'admin@gmail.com', role: 'admin', createdAt: { toDate: () => new Date('2023-01-01') }, photoURL: null },
        { id: 'user-2', uid: 'uid-2', displayName: 'Jane Doe', email: 'jane@example.com', role: 'user', createdAt: { toDate: () => new Date('2023-02-15') }, photoURL: null },
    ];

    // Start with EMPTY products to satisfy "profit must be 0" request
    public products: any[] = [];

    public services = [
        { id: 'serv-1', name: 'CCTV Systems', description: 'High-definition surveillance solutions for homes and businesses.', icon: 'Camera', imageUrl: PlaceHolderImages.find(i => i.id === 'cctv-service')?.imageUrl },
        { id: 'serv-2', name: 'Dashcam Installation', description: 'Professional installation of dashcams for vehicle safety.', icon: 'Car', imageUrl: PlaceHolderImages.find(i => i.id === 'dashcam-service')?.imageUrl },
        { id: 'serv-3', name: 'System Maintenance', description: 'Regular maintenance checks to ensure system reliability.', icon: 'Wrench', imageUrl: PlaceHolderImages.find(i => i.id === 'maintenance-service')?.imageUrl },
    ];

    public requests = [
        { id: 'req-1', name: 'Alice Williams', email: 'alice@test.com', phone: '(555) 123-4567', message: 'I need a quote for a home security system.', status: 'New', createdAt: { toDate: () => new Date('2023-11-01'), toMillis: () => Date.now() } },
    ];

    public pricing = [
        { id: 'price-1', name: 'Basic', price: 499, features: ['2 Full HD Cameras', '1 TB Storage', 'Mobile Viewing'], status: 'Active', popular: false },
        { id: 'price-2', name: 'Standard', price: 999, features: ['4 Full HD Cameras', '2 TB Storage', 'AI Motion Alerts'], status: 'Active', popular: true },
        { id: 'price-3', name: 'Pro', price: 1899, features: ['8 4K UHD Cameras', '4 TB Storage', '24/7 Support'], status: 'Active', popular: false },
    ];

    public currentUser: any | null = null;

    public sales: any[] = [];

    // Local Storage Keys
    private STORAGE_KEYS = {
        PRODUCTS: 'eyronix_products',
        SALES: 'eyronix_sales',
        SESSION: 'eyronix_session'
    };

    constructor() {
        this.loadFromStorage();
    }

    public settings: any = {
        facebookUrl: '',
        twitterUrl: '',
        instagramUrl: '',
        phoneNumber: '',
        email: '',
        address: '',
        termsUrl: '',
        privacyUrl: '',
    };

    private loadFromStorage() {
        if (typeof window === 'undefined') return;

        try {
            const storedProducts = localStorage.getItem(this.STORAGE_KEYS.PRODUCTS);
            if (storedProducts) {
                this.products = JSON.parse(storedProducts);
            }

            const storedSales = localStorage.getItem(this.STORAGE_KEYS.SALES);
            if (storedSales) {
                this.sales = JSON.parse(storedSales);
            }

            const storedSession = localStorage.getItem(this.STORAGE_KEYS.SESSION);
            if (storedSession) {
                this.currentUser = JSON.parse(storedSession);
            }

            const storedSettings = localStorage.getItem('eyronix_settings');
            if (storedSettings) {
                this.settings = JSON.parse(storedSettings);
            }
        } catch (error) {
            console.error('Failed to load from mock storage', error);
        }
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(this.STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
            localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(this.sales));
            if (this.currentUser) {
                localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(this.currentUser));
            } else {
                localStorage.removeItem(this.STORAGE_KEYS.SESSION);
            }
            localStorage.setItem('eyronix_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save to mock storage', error);
        }
    }

    // ... (rest of class)

    updateSettings(newSettings: any) {
        this.settings = { ...this.settings, ...newSettings };
        this.notify();
    }



    // Subscriptions
    subscribe(listener: ChangeListener) {
        this.listeners.push(listener);
        // Initial notify to sync state if needed, though usually not required for subscription
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.saveToStorage(); // Auto-save on any change
        this.listeners.forEach(l => l());
    }

    // Auth Mutations
    signIn(email: string) {
        // Find user or create a mock one. Currently just matching email or defaulting to user role
        // Check if it's the admin
        const isAdmin = email === 'admin@gmail.com';

        this.currentUser = {
            uid: isAdmin ? 'mock-admin-uid-123' : `user-${Date.now()}`,
            email: email,
            displayName: isAdmin ? 'Admin User' : 'User',
            photoURL: null,
            isAdmin: isAdmin,
            role: isAdmin ? 'admin' : 'user'
        };
        this.notify();
        return this.currentUser;
    }

    signOut() {
        this.currentUser = null;
        this.notify();
    }

    // Data Mutations
    addOrder(item: any, type: 'product' | 'package', userId: string = 'guest') {
        // Use current user ID if available and not explicitly guest
        const activeUserId = this.currentUser ? this.currentUser.uid : userId;

        const sale = {
            id: `sale-${Date.now()}`,
            item: item,
            type: type,
            amount: item.price,
            userId: activeUserId,
            date: new Date(),
            status: 'Completed'
        };
        // Use spread to trigger react state updates if we were using it directly, but here just for array immutability
        this.sales = [sale, ...this.sales];

        if (type === 'product') {
            // Decrement stock if it's a product
            const productIndex = this.products.findIndex(p => p.id === item.id);
            if (productIndex !== -1 && this.products[productIndex].stock > 0) {
                // Clone array to avoid direct mutation issues
                const newProducts = [...this.products];
                newProducts[productIndex] = { ...newProducts[productIndex], stock: newProducts[productIndex].stock - 1 };

                // If stock reaches 0, update status
                if (newProducts[productIndex].stock === 0) {
                    newProducts[productIndex].status = 'Out of Stock';
                } else if (newProducts[productIndex].stock < 10) {
                    newProducts[productIndex].status = 'Low Stock';
                }
                this.products = newProducts;
            }
        }
        this.notify();
        return sale;
    }

    // Mutations
    addProduct(product: any) {
        const newProduct = { ...product, id: product.id || `prod-${Date.now()}` };
        this.products = [...this.products, newProduct];
        this.notify();
        return newProduct;
    }

    updateProduct(id: string, updates: any) {
        this.products = this.products.map(p => p.id === id ? { ...p, ...updates } : p);
        this.notify();
    }

    deleteProduct(id: string) {
        this.products = this.products.filter(p => p.id !== id);
        this.notify();
    }
}

export const mockDb = new MockDatabase();
