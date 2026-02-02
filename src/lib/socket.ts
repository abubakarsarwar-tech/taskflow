import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

class SocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private currentBoardId: string | null = null;
    private currentUserId: string | null = null;

    connect(token: string) {
        if (this.socket?.connected) {
            console.log('🔌 Socket already connected');
            return;
        }

        console.log('🔌 Connecting to real-time server at:', SOCKET_URL);

        try {
            this.socket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,
                autoConnect: true,
            });

            this.socket.on('connect', () => {
                console.log('✅ Successfully connected to real-time server!', this.socket?.id);
                this.reconnectAttempts = 0; // Reset counter on successful connection

                // Re-join rooms on reconnection
                if (this.currentBoardId) {
                    console.log('🔄 Re-joining board:', this.currentBoardId);
                    this.socket?.emit('join_board', this.currentBoardId);
                }
                if (this.currentUserId) {
                    console.log('🔄 Re-joining user:', this.currentUserId);
                    this.socket?.emit('join_user', this.currentUserId);
                }
            });

            this.socket.on('connect_error', (error) => {
                this.reconnectAttempts++;
                console.warn(`🔌 Socket connection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} failed:`, error.message);

                // Don't spam the console with full error objects
                if (this.reconnectAttempts === 1) {
                    console.log('🔌 Socket will retry automatically. This is normal during page loads.');
                }

                // After max attempts, give up gracefully
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.warn('🔌 Socket connection failed after max attempts. Real-time features will be disabled.');
                    console.log('💡 The app will continue to work, but you won\'t see live updates from other users.');
                }
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
                if (reason === 'io server disconnect') {
                    // Server disconnected us, try to reconnect
                    this.socket?.connect();
                }
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
                this.reconnectAttempts = 0;
            });

            this.socket.on('reconnect_failed', () => {
                console.warn('🔌 Socket reconnection failed. Real-time features disabled.');
            });

        } catch (error) {
            console.error('🔌 Failed to initialize socket:', error);
            // Don't throw - allow the app to continue without real-time features
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.reconnectAttempts = 0;
            this.currentBoardId = null;
            this.currentUserId = null;
        }
    }

    joinBoard(boardId: string) {
        this.currentBoardId = boardId;
        this.socket?.emit('join_board', boardId);
    }

    joinUser(userId: string) {
        this.currentUserId = userId;
        this.socket?.emit('join_user', userId);
    }

    on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }

    getSocket() {
        return this.socket;
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
