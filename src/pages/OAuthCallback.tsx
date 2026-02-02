import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { completeOAuthLogin } = useAuth();
    const hasProcessed = useRef(false);

    useEffect(() => {
        // Prevent multiple executions
        if (hasProcessed.current) return;

        const token = searchParams.get('token');
        const userDataStr = searchParams.get('user');

        console.log('🌐 OAuthCallback received params:', { hasToken: !!token, hasUser: !!userDataStr });

        if (token && userDataStr) {
            try {
                const userData = JSON.parse(decodeURIComponent(userDataStr));
                console.log('👤 OAuthCallback: Completing login for:', userData.email);

                // Mark as processed BEFORE calling completeOAuthLogin
                hasProcessed.current = true;

                // Complete the OAuth login
                completeOAuthLogin(token, userData);

                // Small delay to allow auth state to settle before navigation
                // This prevents socket connection errors during page transition
                setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                }, 300);
            } catch (error) {
                console.error('❌ Error parsing OAuth user data:', error);
                hasProcessed.current = true;
                navigate('/auth?error=oauth_error', { replace: true });
            }
        } else {
            const error = searchParams.get('error');
            console.warn('⚠️ OAuthCallback: Missing data or error:', error);
            hasProcessed.current = true;
            if (error) {
                navigate(`/auth?error=${error}`, { replace: true });
            } else {
                navigate('/auth?error=missing_data', { replace: true });
            }
        }
    }, []); // Empty dependency array - only run once on mount

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-muted-foreground animate-pulse">Completing Google Login...</p>
            </div>
        </div>
    );
}
