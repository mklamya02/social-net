import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openAuthModal } from '@/store/slices/uiSlice';

/**
 * Hook to guard actions that require authentication
 */
export const useAuthGuard = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const requireAuth = useCallback(
    (action, view = 'login') => {
      if (isAuthenticated) {
        action();
      } else {
        dispatch(openAuthModal(view));
      }
    },
    [isAuthenticated, dispatch]
  );

  return requireAuth;
};
